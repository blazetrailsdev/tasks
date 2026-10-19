---
title: "TSETracker's RubyTracker arms are text heuristics, not RenderParser"
status: blocked
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-19T22:17:58Z"
assignee: "rack-session-encryptor-drop-json-byte-form-arm"
blocked-by: 'owner decision: the three RubyTrackerTests templates are Ruby call syntax (render partial: "x", ...), which no TS parse of the compiled template accepts; converging needs the test templates respelled as render({ ... }) and a ruling on option-key spelling (spacer_template vs spacerTemplate)'
closed-reason: null
---

## Context

trails#9042 taught `TSETracker#renderDependencies` (`packages/actionview/src/dependency-tracker/tse-tracker.ts`)
to give the answers `RubyTracker` gives for the three RubyTrackerTests
(`vendor/rails/v8.0.2/actionview/test/template/dependency_tracker_test.rb:274-302`).
The repo owner ruled this, and the ruling is in `packages/actionview/CLAUDE.md`. The arms are text heuristics,
not `PrismRenderParser#render_calls` / `render_call_options`
(`vendor/rails/v8.0.2/actionview/lib/action_view/render_parser/prism_render_parser.rb:6-37,42-91`):

- `args.split("%>")[0]` cuts off a call whose string argument contains `%>`.
- `/\b(\w+):/` also matches a `key:` inside a literal or a ternary, and the `{...}` strip handles only one level of nesting.
- The `object:` / `collection:`-without-`partial:` skip (`prism_render_parser.rb:21-24`) is not ported, and neither is `RENDER_TYPE_KEYS` (`render_parser.rb:6`).

## Acceptance criteria

- The render-call options are read from the parsed TypeScript of the compiled template, mirroring `render_call_options` (`RENDER_TYPE_KEYS` intersection, `ALL_KNOWN_KEYS` subset) and the object/collection/partial guard in `render_calls`.
- The three RubyTrackerTests and the existing dependency-tracker tests still pass, and the heuristic gaps listed in `packages/actionview/CLAUDE.md` are removed.
