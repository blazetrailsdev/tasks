---
title: "activerecord: top-level lib files off the ruby-compat barrel"
status: draft
updated: 2026-11-25
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 520
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`migrate-activerecord-off-the-ruby-compat-barrel` is ~1.8k changed lines (236 files in `packages/activerecord/lib`, ~7.8 lines/file after prettier), so it cannot ship under the 1000-LOC ceiling as one PR (found on trails#10743, which shipped activemodel + arel the same way). This batch covers the top-level files of packages/activerecord/lib (65 files).

Method from trails#10743: value bindings go to the module `scripts/boot-graph/scc-map.json` names; type-only bindings go to their declaring `ruby-compat/lib` file (checker-resolved), and an all-type group becomes `import type`. `relation/spawn-methods.ts`'s `import * as RubyCompat` becomes a namespace import of `@blazetrails/ruby-compat/hash`, because the file exports its own `except`. Expect `scripts/package-size/baseline.json`'s activerecord row to need a raise with a reason (+~1%).

## Acceptance criteria

- [ ] No `from "@blazetrails/ruby-compat"` import remains in the top-level files of packages/activerecord/lib (65 files)
- [ ] Each binding moves to the subpath the harness binding map gives it
- [ ] Build, lint, virtualized DX types and touched tests green; ruby-compat boot count does not rise
