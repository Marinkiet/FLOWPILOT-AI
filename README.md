# FlowPilot AI ✦

**Don't just test your app. Walk through it.**

FlowPilot is an AI agent that tests your web app the way a real user would — by actually using it. You give it a goal, it opens a browser, walks through your app step by step, and tells you exactly what broke and why.

---

<!-- SCREENSHOT: Dashboard home page showing the stat cards and "Run Journey" CTA -->
![Dashboard]()

---

## The problem it solves

Your tests are green. Your app is broken.

Traditional automated tests check if individual functions work. They don't check if a real person can actually complete a task — like buying a product, registering an account, or checking out.

FlowPilot catches the things tests miss:
- A login that redirects to a page that doesn't exist
- A payment that silently times out with no error message
- An order history that's always empty right after you placed an order
- A cart with no feedback when you add something to it

---

## How it works

You type a goal. FlowPilot does the rest.

> *"Purchase a laptop from the home page through to order confirmation"*

The agent opens a real browser, navigates your app, clicks buttons, fills forms, and observes what happens. When something goes wrong, it captures the evidence — screenshots, error logs, failed network requests — and writes up a report.

```
OBSERVE → REASON → ACT → OBSERVE AGAIN → INVESTIGATE → REPORT
```

---

<!-- SCREENSHOT: Run Journey page with the goal input field and preset goal buttons -->
![Run Journey]()

---

## What you see during a run

As the agent walks through your app, you can watch each step tick by in real time.

<!-- SCREENSHOT: Journey Detail page with steps showing green ✓ and red ✗ status -->
![Live Journey]()

Every step shows:
- Whether it passed or failed
- What the agent observed
- How long it took
- Any console errors or network failures

---

## The quality report

When the run finishes, FlowPilot generates a full report.

<!-- SCREENSHOT: Report page showing the score ring (e.g. 51/100 in red) and the executive summary -->
![Quality Report - Score]()

The score tells you at a glance how healthy the user journey is. Below it, every finding is listed with its severity.

---

### Findings

<!-- SCREENSHOT: Report Findings tab showing CRITICAL and HIGH badges with finding titles -->
![Findings]()

Each finding tells you:
- What broke
- Why it broke (confirmed fact vs agent inference — clearly labelled)
- What to fix

---

### Friction

<!-- SCREENSHOT: Report Friction tab showing long-wait and missing-feedback friction points -->
![Friction Points]()

Friction points are things that don't break the app but make it frustrating — long waits with no loading indicator, actions with no visual feedback, confusing navigation.

---

### Recommendations

<!-- SCREENSHT: Report Recommendations tab showing prioritised fix list -->
![Recommendations]()

Every recommendation is prioritised. High priority items are things that stop users from completing their goal. Medium and low are improvements.

---

### Agent reasoning

<!-- SCREENSHOT: Report Reasoning tab showing the observe/act/reason timeline -->
![Agent Reasoning Log]()

You can see exactly what the agent was thinking at every step — what it observed, what it decided to do, and what it concluded.

---

## The demo app

FlowPilot comes with a demo e-commerce store called **TechMart** that has intentional bugs built in — so you can see FlowPilot find real problems on your first run.

<!-- SCREENSHOT: Demo Shop home page (TechMart) -->
![Demo Shop]()

Known bugs the agent will find:
- Login redirects to a page that doesn't exist
- Payment times out 40% of the time with no explanation
- Adding to cart shows no confirmation to the user
- Order history is always empty after a purchase
- Navigation has duplicate links

---

## Getting started

```bash
npm install
npm run dev
```

That's it. Three services start:

| | URL |
|---|---|
| FlowPilot Dashboard | http://localhost:5173 |
| API Server | http://localhost:3001 |
| Demo Shop | http://localhost:5174 |

No API key needed. FlowPilot runs in demo mode out of the box.

To use a real AI model, add a `.env` file:

```
LLM_PROVIDER=openai
OPENAI_API_KEY=your-key-here
```

---

## Project layout

```
apps/
  dashboard/      ← The FlowPilot UI
  demo-shop/      ← The test target app (with intentional bugs)
packages/
  agent-core/     ← The AI agent logic
  browser-runner/ ← Playwright browser automation
  shared/         ← Shared types
server/           ← API server
```

---
