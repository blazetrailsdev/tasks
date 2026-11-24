---
title: "vi.mock does not reach modules the booted app has loaded"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

Surfaced on trailmap#201.

In a trailmap vitest file, `vi.mock("../../lib/ringo-core.ts", …)` replaced the module for the test file's own imports, but not for the app. A request driven through the booted app (`controllerTestCase` → `DeploysController#screen`) still called the real `renderPaneLog`. So did a direct call to a model function (`deployScreen` in `app/models/deploy-log.ts`), once the test setup had booted the app. The app's modules seem to be loaded outside vitest's module graph: the autoloader or boot path imports them by file URL (cf. `trailties/dist/server/boot.js:30`, `await import(pathToFileURL(APP_PATH).href)`). That mechanism is not verified; confirm it first.

The workaround in trailmap is an injectable `render` parameter on `deployScreen` (and, for symmetry, on `DeployLog.screen` in rails/). Rails needs no such parameter: `Minitest::Mock#stub` (`RingoCore.stub(:render_pane_log, …)`) reaches the app because Ruby has one constant table.

Expected: a test can stub a module an app file imports, and the booted app sees the stub, as `stub` does in Rails. Either the app's modules load through vitest's module graph under test, or trails documents a supported stub point. Then delete the `render` parameter from `deployScreen`.
