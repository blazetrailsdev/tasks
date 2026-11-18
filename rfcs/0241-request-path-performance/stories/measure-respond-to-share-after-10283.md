---
title: "Measure the respond_to family's busy-CPU share after trails#10283"
status: claimed
updated: 2026-11-18
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: "2026-11-18T14:36:34Z"
assignee: "measure-allocation-gap-commit-and-method"
blocked-by: null
closed-reason: null
---

## Context

trails#10283 (story `respond-to-lookup-cache`) memoized `basicObjRespondTo`'s
`method_boundp` half and the `respondToMissing` / `isRespondTo` chain lookup
per prototype in `packages/ruby-compat/lib/object.ts` (`_methodBound`,
`_chainEntry`, keyed on `methodCacheSerial`). Microbenchmarks (tsx, outside
vitest) showed basicObjRespondTo 1206→327 ns and rbObjRespondTo 993→215 ns.
The slim profile harness needs the c7i.xlarge box and was not run, so the
story's "respond_to family below 1.5% of busy CPU" criterion and the
CPU/request, p95, p99 numbers are unverified.

## Acceptance criteria

- Run the slim profile harness on c7i.xlarge at main after trails#10283.
- Record CPU/request, p95, p99 and the respond_to family's share of busy CPU
  (`basicObjRespondTo`, `rbObjRespondTo`, `methodBoundp`, `_chainEntry`).
- If the share is ≥1.5%, file a sized follow-up naming the remaining hot frame.
