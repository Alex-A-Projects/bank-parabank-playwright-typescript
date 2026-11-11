# Headless-First Rule

**Every browser this suite drives runs headless unless a documented exception applies.**

---

## The rule

Do not enable headed mode — `--headed`, `headless: false`, `launchOptions.headless: false` — unless one of the exceptions below applies and you have justified it.

This applies to:

- exploration and locator discovery,
- page object work,
- test generation,
- debugging a failing test,
- screenshots and traces,
- network and console inspection.

The three suite configs are already headless by default: `playwright.ui.config.ts` uses `devices['Desktop Chrome']` without overriding `headless`, and the API and database suites open no browser at all.

---

## Why

- **CI efficiency.** A headed browser needs a display server and roughly doubles the memory cost. The pipeline runs headless on a GitHub runner.
- **Reproducibility.** Rendering differences between headed and headless are a classic source of "it only fails on my machine".
- **Cost.** A headed browser on a developer machine competes with everything else for resources.
- **The public demo.** A headed browser is a browser session against an instance that may be the shared public demo. Keeping the browser invisible keeps the traffic pattern ordinary.

---

## What to use instead

| Need | Use |
|---|---|
| Inspect the DOM / accessibility tree | `browser_snapshot` (headless) |
| See the page | `browser_take_screenshot` (headless) |
| Read console output | `browser_console_messages` |
| Inspect requests | `browser_network_requests` |
| Read live page state | `browser_evaluate` |
| Interact | `browser_click`, `browser_fill_form`, `browser_select_option`, `browser_hover`, `browser_press_key` |
| Wait for a state | `browser_wait_for`, or a Playwright locator wait |
| Understand a failure after the fact | the trace and the video Playwright already records (`trace: 'on-first-retry'`, `video: 'retain-on-failure'`) |

The same applies without MCP: `npx playwright codegen` starts a browser for recording — that is an exploration tool, and it is the one place a visible browser is normal. Close it before writing code.

---

## When headed mode is justified

Only for:

1. **Bug reproduction** — the failure is understood from snapshots, screenshots, console output and network traffic, but the root cause still is not.
2. **Visual or animation issues** — a rendering or animation difference that the headless video and trace did not explain.
3. **Browser-specific behaviour** — hover states, focus styling, drag-and-drop or pointer events that behave differently, and only after headless inspection confirmed the difference exists.
4. **Explicit user request.**

Before switching, do all of this and be able to explain why it was not enough:

1. Took a headless snapshot.
2. Took a headless screenshot.
3. Read the console messages.
4. Read the network requests.
5. Checked the recorded trace and video.

---

## Rules inside the test code

- The committed configs stay headless. A spec never sets `headless`.
- `npm run test:headed` exists for a developer's local debugging session and is **never** used in CI.
- Never make a test's outcome depend on the browser being visible.
- Screenshots and videos are artefacts, not assertions: a test asserts on state, never on a picture.
