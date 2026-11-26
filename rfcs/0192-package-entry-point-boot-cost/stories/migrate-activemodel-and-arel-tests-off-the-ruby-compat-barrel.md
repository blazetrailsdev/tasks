---
title: "activemodel and arel tests off the ruby-compat barrel"
status: done
updated: 2026-11-26
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#10771
claim: "2026-11-25T23:29:45Z"
assignee: "migrate-activemodel-and-arel-tests-off-the-ruby-compat-barrel"
blocked-by: null
closed-reason: null
---

## Context

trails#10743 moved `packages/activemodel/lib` and `packages/arel/lib` off the ruby-compat barrel, but their tests still import it: 60 files in `packages/activemodel/test` and 18 in `packages/arel/test`. The actionpack sibling is `migrate-actionpack-tests-off-the-ruby-compat-barrel`.

## Acceptance criteria

- [ ] No `from "@blazetrails/ruby-compat"` import remains under `packages/activemodel/test` or `packages/arel/test`
- [ ] Each binding moves to the subpath the harness binding map (`scripts/boot-graph/scc-map.json`) gives it; types to their declaring `ruby-compat/lib` file via `import type`
- [ ] The touched test files pass
