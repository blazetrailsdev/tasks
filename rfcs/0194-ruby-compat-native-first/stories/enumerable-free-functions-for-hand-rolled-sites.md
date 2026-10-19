---
title: "Use the Enumerable free functions where ported bodies hand-roll each_slice / min_by / max_by / tally / each_with_object / sort_by"
status: draft
updated: 2026-10-19
rfc: "0194-ruby-compat-native-first"
cluster: enumerable
packages: ["activerecord", "activesupport", "actionpack", "actionview"]
deps: ["enumerable-free-functions-over-iterable"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails bodies that call `each_slice`, `min_by`, `max_by`, `tally`,
`each_with_object`, `sort_by`, `each_with_index` or `sum` with a block are
ported today as hand-written `for` loops or `reduce` calls. The call-set gate
credits them through `JS_ENUMERABLE_ALIASES`
(`scripts/api-compare/enumerable-idioms.ts:41-83`: `inject` → `reduce`,
`sort_by` → `sort`) or not at all. A loose `reduce` is the building block the
table's header comment warns about (`:14-17`). Once
`enumerable-free-functions-over-iterable` exports the free functions, those
sites can make the call Rails makes.

## Acceptance criteria

- [ ] Each Ruby call above, in a ported body under `packages/*/src` (found through `pnpm rails:find` / the `parity:api` manifest's Ruby call sets), uses the free function: `eachSlice(xs, n, fn)`, `minBy(xs, fn)`, and so on. The free function is added to `enumerable.ts` in this PR only if it has a site here. The PR lists the sites it converted.
- [ ] A site stays as written where its receiver is a Relation or association (the Rails method is `Relation#…`, not `Enumerable#…`) or where the TS port already makes the faithful native call (`.map`, `.filter`).
- [ ] Any baseline row these conversions make stale is deleted and tightened. Above the PR LOC ceiling, ship the activerecord sites and file a sibling story for the rest.
