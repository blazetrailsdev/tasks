---
title: "Journey call and call-argument baselines to zero"
status: ready
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["journey-visualizer-reads-its-assets-off-disk"]
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Nine baseline rows sit under
`scripts/api-compare/call-mismatches-exclude/actiondispatch/journey/` — eight
`calls` and one `args`. **This story owns seven of them.** The two
`gtg/transition-table.json` visualizer rows are already owned by
`journey-visualizer-reads-its-assets-off-disk` (RFC 0113, `ready`, 200 loc),
which is listed as a dependency; do not touch that shard. Both gates are only-shrink, so
each converged row is deleted by hand and the stale high-water mark narrowed
with `pnpm parity:api:calls:tighten actiondispatch/journey/<file>.json`. Never
`--write` or reseed.

| Shard               | Rails method      | Row                                                                                                                  |
| ------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `nodes/node.json`   | `glob?`           | Rails `node.rb:38-40` reads `stars.any?`; trails `node.ts:276-278` reads `this.stars.length > 0`. A direct converge. |
| `nodes/node.json`   | `to_dot`, `to_s`  | RFC 0047 seed rows on the omitted `accept` call.                                                                     |
| `route.json`        | `verb_matcher`    | RFC 0047 seed row on the omitted `fetch`. Note Ruby `fetch` vs `??` differ on a stored `nil`/`false`.                |
| `gtg/builder.json`  | `build_followpos` | Order-only: the port makes every call Rails makes, in a different sequence. Reorder to Rails' `firstpos`, `lastpos`. |
| `path/pattern.json` | `captures`        | Nested-class divergence in `MatchData`.                                                                              |
| `visitors.json`     | `escape`          | Nested-class divergence in `Parameter`.                                                                              |

The two nested-class rows are also named by
`converge-nested-class-call-mismatches-surfaced-by-population-fix` (RFC 0023),
which is `ready` and unclaimed and covers the same class of row repo-wide. This
story owns only the two Journey shards; do not widen into the rest of that
story's population, and note the overlap in the PR body.

**Do not write a `@missingRailsCall` / `@missingRailsArgs` receipt for the
visualizer rows.** An earlier draft of this story suggested that as a fallback;
it is wrong. RFC 0113's `journey-visualizer-reads-its-assets-off-disk` has
already settled the question the other way — actionpack ships Rails' real
`visualizer/fsm.js`, `fsm.css` and `index.html.erb`, `visualizer` reads them with
`File.read File.join(viz_dir, …)`, and the invented `renderVisualizer` helper and
inlined asset strings are deleted. A receipt would ratify exactly the deviation
that story converges.

## Acceptance criteria

- `scripts/api-compare/call-mismatches-exclude/actiondispatch/journey/` holds no
  rows; empty shard files are deleted.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green, with marks
  narrowed via `:tighten`, never reseeded.
- Any surviving deviation carries a call-site receipt in one of the two
  sanctioned shapes, not a baseline row and not prose.
- No row outside `journey/` is touched.
