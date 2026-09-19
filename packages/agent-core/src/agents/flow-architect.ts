/**
 * Flow Architect Agent
 *
 * Phase: OBSERVE
 * Responsibility: Discover routes, UI elements, and build the journey graph.
 * The agent crawls the application and builds a mental model of all reachable states.
 */

import type {
  FlowArchitect as IFlowArchitect,
  FlowNode,
  BrowserContext,
  LLMProvider,
  JourneyGraph,
  JourneySuggestion,
  UIElement,
} from '@flowpilot/shared';
import { generateId } from '../utils/id.js';

const DISCOVERY_SYSTEM_PROMPT = `You are the Flow Architect component of FlowPilot AI.
Your job is to analyze a web application and identify:
1. All discoverable routes and pages
2. Key UI elements on each page
3. Navigation paths between pages
4. Potential user journeys

Respond in structured JSON only. Be precise and factual.`;

export class FlowArchitectAgent implements IFlowArchitect {
  constructor(
    private readonly llm: LLMProvider,
    private readonly applicationId: string
  ) {}

  async discover(baseUrl: string, browser: BrowserContext): Promise<FlowNode[]> {
    const nodes: FlowNode[] = [];
    const visited = new Set<string>();
    const queue = [baseUrl];

    // Crawl up to 15 pages to build the graph (hackathon-scoped limit)
    while (queue.length > 0 && nodes.length < 15) {
      const url = queue.shift();
      if (!url || visited.has(url)) continue;
      visited.add(url);

      try {
        await browser.goto(url);
        const title = await browser.pageTitle();
        const currentUrl = await browser.currentUrl();
        const path = new URL(currentUrl).pathname;

        const elements = await this.discoverElements(browser);
        const links = await this.discoverLinks(browser, baseUrl);

        const node: FlowNode = {
          id: generateId('node'),
          applicationId: this.applicationId,
          name: title || path,
          path: currentUrl, // Store the full URL so the runner can navigate directly
          title,
          elements,
          edges: [], // Edges populated after all nodes are discovered
        };

        nodes.push(node);

        // Queue unvisited links
        for (const link of links) {
          if (!visited.has(link)) {
            queue.push(link);
          }
        }
      } catch (error) {
        // Non-fatal: log and continue discovery
        console.warn(`[FlowArchitect] Could not crawl ${url}:`, error);
      }
    }

    return nodes;
  }

  async buildJourneyGraph(nodes: FlowNode[]): Promise<JourneyGraph> {
    return {
      applicationId: this.applicationId,
      nodes,
      discoveredAt: new Date().toISOString(),
    };
  }

  async suggestJourneys(
    graph: JourneyGraph,
    userGoal: string
  ): Promise<JourneySuggestion[]> {
    const nodeList = graph.nodes
      .map((n) => `- id:${n.id} name:"${n.name}" path:${n.path}`)
      .join('\n');

    const prompt = `Application routes discovered:\n${nodeList}\n\nUser goal: "${userGoal}"\n\nSuggest 1-3 possible journeys to accomplish this goal. Use the exact node IDs provided above. Return a JSON array like: [{"name":"...","description":"...","userGoal":"...","path":["node_id1","node_id2"],"confidence":0.9}]`;

    const response = await this.llm.chat([
      { role: 'system', content: DISCOVERY_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    try {
      const cleaned = response.content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();

      const parsed = JSON.parse(cleaned) as
        | JourneySuggestion[]
        | { suggestions?: JourneySuggestion[]; journeys?: JourneySuggestion[] };

      let suggestions: JourneySuggestion[];
      if (Array.isArray(parsed)) {
        suggestions = parsed;
      } else if ('suggestions' in parsed && Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions;
      } else if ('journeys' in parsed && Array.isArray(parsed.journeys)) {
        suggestions = parsed.journeys;
      } else {
        suggestions = [];
      }

      // Validate that path IDs actually exist in the graph — fall through if not
      const nodeIds = new Set(graph.nodes.map((n) => n.id));
      const valid = suggestions.filter(
        (s) => Array.isArray(s.path) && s.path.length > 0 && s.path.every((id) => nodeIds.has(id))
      );

      if (valid.length > 0) return valid;
    } catch {
      // Fall through to default
    }

    // Default: use all nodes in order as the journey path
    return [
      {
        name: `Complete: ${userGoal}`,
        description: `Auto-generated path attempting: ${userGoal}`,
        userGoal,
        path: graph.nodes.map((n) => n.id),
        confidence: 0.6,
      },
    ];
  }

  private async discoverElements(browser: BrowserContext): Promise<UIElement[]> {
    const elements: UIElement[] = [];

    const interactiveSelectors: Array<{ selector: string; type: UIElement['type'] }> = [
      { selector: 'button', type: 'button' },
      { selector: 'a[href]', type: 'link' },
      { selector: 'input', type: 'input' },
      { selector: 'form', type: 'form' },
      { selector: 'nav', type: 'nav' },
      { selector: 'h1, h2', type: 'heading' },
    ];

    for (const { selector, type } of interactiveSelectors) {
      try {
        const exists = await browser.exists(selector);
        if (!exists) continue;

        elements.push({
          selector,
          type,
          isInteractive: ['button', 'link', 'input', 'form'].includes(type),
        });
      } catch {
        // Ignore individual element discovery failures
      }
    }

    return elements;
  }

  private async discoverLinks(
    browser: BrowserContext,
    baseUrl: string
  ): Promise<string[]> {
    try {
      const links = await browser.evaluate<string[]>(`
        Array.from(document.querySelectorAll('a[href]'))
          .map(a => a.href)
          .filter(href => href.startsWith('${baseUrl}'))
          .slice(0, 20)
      `);
      return [...new Set(links)];
    } catch {
      return [];
    }
  }
}
