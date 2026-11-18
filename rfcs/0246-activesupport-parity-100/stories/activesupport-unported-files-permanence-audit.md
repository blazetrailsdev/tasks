---
title: "activesupport: reduce unported-files rows to PERMANENT: receipts"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
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

`scripts/parity/unported-files/activesupport.ts` has 20 rows, and
`scripts/parity/unported-files/baseline.json` has 10 activesupport rows.
Their reasons are prose, and none of them starts with `PERMANENT:`.
Together they hide 140 Ruby defs from `parity:api` and an unmeasured number
of tests from `parity:test`.

## Acceptance criteria

- [ ] Reword each row to `PERMANENT: <section>` if it is a ratified limit
      (e.g. `SOLID_STACK_ONLY` for the Redis and Memcache stores,
      `attribute_accessors_per_thread.rb` under § "A thread-local block stack
      forks per async block").
- [ ] For each row that is not a ratified limit, file a port story in RFC
      0246, and add it to the deps of `activesupport-parity-100-gate` in the
      same PR.
- [ ] Every activesupport row in `unported-files/activesupport.ts` and in
      `baseline.json` starts with `PERMANENT:`.
