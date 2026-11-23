---
title: "Measure the attribute first-read allocation share after trails#10263 on the slim harness"
status: blocked
updated: 2026-11-18
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: "2026-11-18T14:36:34Z"
assignee: "measure-allocation-gap-commit-and-method"
blocked-by: "needs c7i.xlarge slim-harness rig time; operator chose not to launch a rig on 2026-11-18"
closed-reason: null
---

## Context

trails#10263 removed the two `rbBlock` closures from `LazyAttributeSet#fetchValue`
(`packages/activemodel/lib/attribute-set/builder.ts`, Rails
`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set/builder.rb:41-58`).
A plain-node microbench showed a first read going from 1117.9 to 829.3 ns (26%).
The slim profile harness from this RFC's README was not run, so
`attribute-first-read-allocations`' AC3 is unverified. AC3 asks for the reader
`get` (`attribute-methods/read`), the builder block and ruby-compat `fetch`
(`packages/ruby-compat/lib/hash.ts`) to fall together below 4% of allocated bytes.

## Acceptance criteria

- [ ] Run the slim profile harness (plain, CPU and allocation passes) on main after trails#10263.
- [ ] Record CPU per request, p95, p99 and the combined share of the three sites.
- [ ] If the share is still at least 4%, file the next site to cut, with its profile share.
