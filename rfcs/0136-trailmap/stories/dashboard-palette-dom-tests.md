---
title: "DOM tests for the dashboard palette's page code (open, close, carry-over)"
status: ready
updated: 2026-11-16
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#147 fixed a palette bug in `app/assets/javascripts/dashboard.js`.
Closing the `<dialog>` handed focus back to `#fleetSearch`, and its `focus`
listener reopened the palette, so Esc and Cancel never closed it. The pure
outcome logic (`controlOutcome` in `fleet-format.js`) is unit-tested in
`test/assets/fleet-format.test.js`. The page code that wires it to the DOM has
no test harness at all: no jsdom or happy-dom. #147's open/close and
carry-over behaviour was checked only by an ad-hoc headless-Chromium script.
The same bug can come back without failing a test.

## Acceptance criteria

- A DOM test environment (happy-dom or jsdom, as a dev dependency) loads
  `dashboard.js` against the rendered dashboard page.
- Tests cover: Esc closes the palette and it stays closed; the X and Cancel close
  it; a key typed or pasted into `#fleetSearch` lands in `#paletteInput` and fires
  the story search; a successful spawn closes the palette and writes its
  report to `#paletteDone`.
