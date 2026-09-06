---
title: "Journey's visualizer ships fsm.js/fsm.css/index.html.erb and reads them, dropping renderVisualizer"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 48
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Journey::GTG::TransitionTable#visualizer`
(`actionpack/lib/action_dispatch/journey/gtg/transition_table.rb:127-131`) reads
its three assets off disk:

```ruby
def visualizer(paths, title = "FSM")
  viz_dir   = File.join __dir__, "..", "visualizer"
  fsm_js    = File.read File.join(viz_dir, "fsm.js")
  fsm_css   = File.read File.join(viz_dir, "fsm.css")
  erb       = File.read File.join(viz_dir, "index.html.erb")
  states    = "function tt() { return #{to_json}; }"
  ...
```

`packages/actionpack/src/action-dispatch/journey/gtg/transition-table.ts:256-279`
has no asset directory: `fsm.js`, `fsm.css` and `index.html.erb` are inlined into
`packages/actionpack/src/action-dispatch/journey/visualizer.ts`, and the method
calls a `renderVisualizer({...})` helper Rails does not have instead of reading
and interpolating the template itself.

PR #7462 replaced the old, now-stale `join()` baseline row with
`join(ref:__dir__, str:.., str:visualizer)` when `File` left
`CORE_CLASS_RECEIVERS` — the argument list became visible for the first time and
named the directory that does not exist.

## Acceptance criteria

- `actionpack` ships `visualizer/fsm.js`, `visualizer/fsm.css` and
  `visualizer/index.html.erb` as real files at Rails' path, copied from
  `vendor/rails/actionpack/lib/action_dispatch/journey/visualizer/`, and they are
  included in the published package.
- `visualizer` reads them with `File.read File.join(viz_dir, …)` in Rails' order
  and renders `index.html.erb` through the trails TSE handler, with the same
  local names (`fsm_js`, `fsm_css`, `erb`, `states`, `fun_routes`) the template
  binds.
- `renderVisualizer` and the inlined asset strings in
  `journey/visualizer.ts` are deleted — `parity:api:extra` should lose the
  invented surface, not gain a receipt for it.
- The `join(ref:__dir__, str:.., str:visualizer)` row is removed from
  `scripts/api-compare/call-mismatches-exclude/actiondispatch/journey/gtg/transition-table.json`
  (only-shrink: delete by hand, no reseed) and `pnpm parity:api:calls:args` is green.
- `__dir__` resolves without a `node:*` import or `import.meta` leaking into a
  browser bundle; check how the other packaged-asset call sites in actionpack do it.
