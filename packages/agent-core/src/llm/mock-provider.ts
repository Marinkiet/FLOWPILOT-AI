/**
 * Mock LLM provider for local development and demos.
 * Returns plausible structured responses without needing an API key.
 * The demo works out-of-the-box with this provider.
 */

import { BaseLLMProvider } from './base-provider.js';
import type { LLMMessage, LLMResponse, LLMOptions } from '@flowpilot/shared';

export class MockLLMProvider extends BaseLLMProvider {
  readonly name = 'mock';

  async chat(messages: LLMMessage[], _options?: LLMOptions): Promise<LLMResponse> {
    const lastMessage = messages[messages.length - 1]?.content ?? '';

    // Route to the appropriate mock response based on prompt content
    let content: string;

    if (lastMessage.includes('discover') || lastMessage.includes('routes')) {
      content = this.mockDiscovery();
    } else if (lastMessage.includes('journey') && lastMessage.includes('steps')) {
      content = this.mockJourneyPlanning();
    } else if (lastMessage.includes('quality finding') || lastMessage.includes('identify quality')) {
      content = this.mockFindings();
    } else if (lastMessage.includes('analyze') || lastMessage.includes('deviation') || lastMessage.includes('friction pattern')) {
      content = this.mockAnalysis();
    } else if (lastMessage.includes('investigate') || lastMessage.includes('root cause')) {
      content = this.mockInvestigation();
    } else if (lastMessage.includes('report') || lastMessage.includes('executive summary')) {
      content = this.mockReport();
    } else if (lastMessage.includes('recommend') || lastMessage.includes('improve') || lastMessage.includes('optimization')) {
      content = this.mockRecommendations();
    } else if (lastMessage.includes('assess') || lastMessage.includes('passed or failed')) {
      content = this.mockStepAssessment();
    } else {
      content = this.mockGenericObservation();
    }

    return { content, usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
  }

  private mockDiscovery(): string {
    return JSON.stringify({
      routes: [
        { path: '/', name: 'Home', elements: ['nav', 'hero', 'featured-products'] },
        { path: '/login', name: 'Login', elements: ['email-input', 'password-input', 'submit-btn'] },
        { path: '/register', name: 'Register', elements: ['name-input', 'email-input', 'password-input'] },
        { path: '/products', name: 'Product Search', elements: ['search-bar', 'product-grid', 'filters'] },
        { path: '/products/:id', name: 'Product Detail', elements: ['add-to-cart', 'quantity', 'reviews'] },
        { path: '/cart', name: 'Cart', elements: ['cart-items', 'total', 'checkout-btn'] },
        { path: '/checkout', name: 'Checkout', elements: ['address-form', 'payment-form', 'place-order-btn'] },
        { path: '/order-confirmation', name: 'Order Confirmation', elements: ['order-id', 'summary'] },
      ],
    });
  }

  private mockJourneyPlanning(): string {
    return JSON.stringify({
      reasoning: 'The user wants to purchase a product. The typical path is: Home → Search → Product Detail → Cart → Checkout → Payment → Confirmation. I need to navigate each step and verify the transition succeeds.',
      plan: [
        { step: 'Navigate to home page', action: 'navigate', target: '/' },
        { step: 'Search for a product', action: 'fill', target: '[data-testid="search-input"]', value: 'laptop' },
        { step: 'Click on search result', action: 'click', target: '.product-card:first-child' },
        { step: 'Add to cart', action: 'click', target: '[data-testid="add-to-cart"]' },
        { step: 'Proceed to checkout', action: 'click', target: '[data-testid="checkout-btn"]' },
      ],
    });
  }

  private mockAnalysis(): string {
    return JSON.stringify([
      {
        type: 'long-wait',
        description: 'Payment processing took 3+ seconds with no loading indicator',
        severity: 'high',
        stepName: 'Payment',
      },
      {
        type: 'missing-feedback',
        description: 'No visual confirmation that item was added to cart',
        severity: 'medium',
        stepName: 'Product Detail',
      },
      {
        type: 'abandoned-flow',
        description: 'User reaches Order History immediately after purchase but sees an empty state — the flow terminates in confusion',
        severity: 'high',
        stepName: 'Order History',
      },
    ]);
  }

  private mockInvestigation(): string {
    return `## Root Cause Investigation

**Observation (CONFIRMED):** The checkout page returned a 500 error after payment form submission.

**Network Evidence (CONFIRMED):** POST /api/orders returned HTTP 500 with response body: {"error": "Payment gateway timeout"}

**Console Evidence (CONFIRMED):** Error: "Unhandled promise rejection: PaymentError: gateway_timeout"

**Hypothesis (INFERRED):** The payment gateway is timing out and the application is not catching this error gracefully. The user sees a blank error page rather than a friendly message with retry options.

**Separation of Evidence vs Assumption:**
- CONFIRMED: The API call fails with a 500 status
- CONFIRMED: The error is a payment gateway timeout
- INFERRED: The timeout threshold may be set too low (< 5 seconds) which is common for Stripe test mode
- INFERRED: The frontend error boundary is not rendering correctly on this route

**Recommended Investigation:** Check the payment service timeout configuration and ensure the frontend has proper error state handling.`;
  }

  private mockReport(): string {
    return 'The purchase journey has critical failures at the payment stage. The user cannot complete their primary goal. Navigation and search work correctly but the checkout flow has a silent failure that results in cart abandonment and an unexplained error state.';
  }

  private mockRecommendations(): string {
    return JSON.stringify([
      {
        priority: 'high',
        title: 'Fix payment timeout error handling',
        description: 'Add a retry mechanism and user-friendly error message when payment gateway times out. Show the user clear options: retry, try another payment method, or save cart.',
        affectedStep: 'Payment',
      },
      {
        priority: 'high',
        title: 'Fix post-login redirect to /dashboard',
        description: 'Change the successUrl in the login handler from /dashboard (which does not exist) to /products.',
        affectedStep: 'Login',
      },
      {
        priority: 'high',
        title: 'Add cart feedback animation',
        description: 'Show a visual confirmation (toast, badge update, mini-cart flyout) when an item is successfully added to cart.',
        affectedStep: 'Product Detail',
      },
      {
        priority: 'medium',
        title: 'Add payment processing indicator',
        description: 'Show a loading spinner or progress bar during payment processing so the user knows their request is being handled.',
        affectedStep: 'Payment',
      },
      {
        priority: 'medium',
        title: 'Persist orders between page navigations',
        description: 'Store placed orders in localStorage or a backend endpoint so Order History is populated immediately after checkout.',
        affectedStep: 'Order History',
      },
    ]);
  }

  private mockStepAssessment(): string {
    return JSON.stringify({
      passed: true,
      assessment: 'Page loaded successfully. URL matches expectation.',
      issue: null,
    });
  }

  private mockFindings(): string {
    return JSON.stringify([
      {
        title: 'Payment gateway timeout causes silent failure',
        description: 'The payment endpoint times out 40% of the time and the user sees a blank error page with no explanation or retry option.',
        severity: 'critical',
        category: 'error-handling',
        rootCauseHypothesis: 'CONFIRMED: POST /api/orders returns 500 with a gateway timeout error. INFERRED: The timeout threshold is set too low.',
        recommendation: 'Add a payment retry mechanism and show a user-friendly error with options: retry, use another payment method, or save cart.',
        isConfirmed: true,
        evidence: [
          { type: 'network-failure', description: 'POST /api/orders returned HTTP 500 — gateway_timeout' },
          { type: 'console-error', description: 'Unhandled promise rejection: PaymentError: gateway_timeout' },
        ],
      },
      {
        title: 'Login redirects to non-existent /dashboard route',
        description: 'After successful login, users are redirected to /dashboard which does not exist, resulting in a 404 error.',
        severity: 'critical',
        category: 'broken-flow',
        rootCauseHypothesis: 'CONFIRMED: The login success redirect is hardcoded to /dashboard. INFERRED: This was not updated when the dashboard route was removed.',
        recommendation: 'Change the post-login redirect to /products or the user\'s intended destination.',
        isConfirmed: true,
        evidence: [
          { type: 'url-change', description: 'Expected redirect to /products, got /dashboard (404)' },
        ],
      },
      {
        title: 'No visual feedback when adding item to cart',
        description: 'Clicking "Add to Cart" updates the cart count but shows no toast, animation, or confirmation. Users may click multiple times thinking the action failed.',
        severity: 'high',
        category: 'friction',
        rootCauseHypothesis: 'INFERRED: The addToCart function only logs to console, with no UI notification implemented.',
        recommendation: 'Add a toast notification or cart flyout when an item is successfully added.',
        isConfirmed: false,
        evidence: [
          { type: 'observation', description: 'Cart badge updated but no feedback shown to user' },
          { type: 'console-error', description: 'console.log: "Item added to cart: ProBook Laptop"' },
        ],
      },
      {
        title: 'Order history always empty after purchase',
        description: 'Immediately after placing an order, the Order History page shows "No orders yet" — orders are not persisted between page navigations.',
        severity: 'high',
        category: 'broken-flow',
        rootCauseHypothesis: 'CONFIRMED: Order state is in-memory only (React Context). Navigation clears the state.',
        recommendation: 'Persist orders to localStorage or a backend API. At minimum, pass order data via router state to the confirmation page.',
        isConfirmed: true,
        evidence: [
          { type: 'observation', description: 'Order History shows empty state immediately after confirmed purchase' },
        ],
      },
      {
        title: 'Duplicate navigation links in header',
        description: 'The navbar contains two separate "Home" links — the logo and an explicit "Home" nav item — creating confusion about which to use.',
        severity: 'medium',
        category: 'confusing-navigation',
        rootCauseHypothesis: 'CONFIRMED: Both the brand logo and a text link both route to "/".',
        recommendation: 'Remove the redundant "Home" text link. The logo serves this purpose.',
        isConfirmed: true,
        evidence: [
          { type: 'observation', description: 'Two elements link to "/" in the top navigation' },
        ],
      },
    ]);
  }

  private mockGenericObservation(): string {
    return JSON.stringify({
      passed: true,
      assessment: 'Page loaded successfully. Proceeding to next step.',
      issue: null,
    });
  }
}
