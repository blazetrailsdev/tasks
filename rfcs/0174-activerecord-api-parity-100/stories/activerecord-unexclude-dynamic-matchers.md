---
title: "activerecord: score dynamic_matchers.rb — the exclusion predates the ported Proxy"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: excluded-files
packages: ["activerecord"]
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

`dynamic_matchers.rb` is excluded (`scripts/parity/unported-files/unscoped.ts`, reason: "Ruby
`method_missing` magic … no JS equivalent"). CLAUDE.md § "Ruby protocol methods with a different JS
mechanism" now records `active_record/dynamic_matchers.rb | Proxy (class chain)`: `base.ts` splices a
Proxy above `Base` so `Topic.findByTitle("x")` reaches `DynamicMatchers#method_missing`. The exclusion
is stale, so `DynamicMatchers`, `Method`, `FindBy`, `FindByBang` and their members
(`vendor/rails/v8.0.2/activerecord/lib/active_record/dynamic_matchers.rb`) are unmeasured.

## Acceptance criteria

- [ ] The `dynamic_matchers.rb` entry is deleted from the unported register (and its row from `unported-files/baseline.json`, which is only-shrink).
- [ ] Every member `parity:api` then reports missing is ported in `packages/activerecord/src/dynamic-matchers.ts` (or the file the conventions map it to), and new call/args rows are converged, not baselined.
- [ ] `finder_test.rb`'s dynamic-finder cases stay green.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:skips:stories && pnpm parity:api:calls
```
