---
title: "Converge TSETracker's render-call reading onto the TSE AST"
status: blocked
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps:
  - tse-tracker-known-keys-are-camelcase
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-10-19T22:17:58Z"
assignee: "rack-session-encryptor-drop-json-byte-form-arm"
blocked-by: 'owner decision: the three RubyTrackerTests templates are Ruby call syntax (render partial: "x", ...), which no TS parse of the compiled template accepts; converging needs the test templates respelled as render({ ... }) and a ruling on option-key spelling (spacer_template vs spacerTemplate)'
closed-reason: null
---

## Context

trails#9042 taught `TSETracker#renderDependencies`
(`packages/actionview/src/dependency-tracker/tse-tracker.ts:92-116`) to give the
answers `RubyTracker` gives for the three RubyTrackerTests
(`vendor/rails/v8.0.2/actionview/test/template/dependency_tracker_test.rb:274-302`).
The repo owner ruled this, and the ruling is in `packages/actionview/CLAUDE.md`.
The arms are text heuristics over the raw template source, not
`PrismRenderParser#render_calls` / `render_call_options`
(`vendor/rails/v8.0.2/actionview/lib/action_view/render_parser/prism_render_parser.rb:6-37,42-91`):

- `args.split("%>")[0]` (`:102`) cuts off a call whose string argument contains `%>`.
- `/\b(\w+):/` (`:104`) also matches a `key:` inside a literal or a ternary, and the `{...}` strip handles only one level of nesting.
- The `object:` / `collection:`-without-`partial:` skip (`prism_render_parser.rb:21-24`) is not ported, and neither is `RENDER_TYPE_KEYS` (`render_parser.rb:6`).

`renderDependencies` carries `@inventedArm if — PERMANENT` and
`@inventedArm replace — PERMANENT` for them.

**Repo-owner ruling, 2026-10-20: converge onto the TSE AST.** The route is
`@blazetrails/tse-compiler`'s `parse`
(`packages/tse-compiler/src/parser.ts:3-8`), which returns typed nodes —
`text` / `code` / `expr` / `blockExpr` / `rawExpr`, each with `value` and
`srcLine` — so the tracker reads the exact JS expression source per node
instead of regexing the whole template. That removes two gaps structurally:
a `%>` inside a string cannot reach the tracker, because the lexer already
closed the tag, and a `<%#` comment is its own node kind rather than a
`replace(/<%#.*?%>/gsu, "")` strip. What remains is scanning one level of
object literal inside a node's `value` for its keys, plus porting the
`render_calls` guard and `RENDER_TYPE_KEYS`.

This is **not** a second compiler and does not reopen the 2026-10-19 ruling:
`tse-compiler-delete-js-parser` (trails#9152) removed `js-parser.ts`, and a
full JS parse stays off the table. The TSE AST is the parser trails already
ships and already runs over every template.

Ordering: the camelCase key set and the respelled fixtures land first in
[[tse-tracker-known-keys-are-camelcase]] — without them the arms are keyed to
Ruby spellings no template contains, and a measured run shows a
`render({ ..., spacerTemplate: "..." })` call losing its spacer dependency and
an unknown-option call returning one where Rails returns none.

## Acceptance criteria

- `renderDependencies` reads render calls from `parse`'s node list — `expr`,
  `blockExpr`, `rawExpr` and `code` nodes — not from `template.source`, and no
  longer strips `<%#` comments by regex.
- The render-call options are read from the node's expression text, mirroring
  `render_call_options` (the `RENDER_TYPE_KEYS` intersection, the
  `ALL_KNOWN_KEYS` subset) and the object/collection/partial guard in
  `render_calls`, over camelCase keys.
- The `%>`-in-string and nested-hash gaps named in
  `packages/actionview/CLAUDE.md` are gone, and that section is rewritten to
  describe what the tracker now does — including dropping the claim that the
  arms are text heuristics, and the two `@inventedArm` receipts if the arms
  they cover no longer exist.
- The three RubyTrackerTests and every existing dependency-tracker test pass
  (25/25 for `dependency_tracker_test.rb`), `pnpm parity:test --package actionview`
  does not regress, and `pnpm parity:api:arms:throws` is green with no stale
  receipt.
- `@blazetrails/actionview` takes no runtime dependency on `typescript` and
  spawns no child process.
