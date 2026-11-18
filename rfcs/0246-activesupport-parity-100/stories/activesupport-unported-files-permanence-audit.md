---
title: "activesupport: reduce unported-files rows to PERMANENT: receipts"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
deps: [activesupport-parity-baseline-remeasure]
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
`baseline.json` has 10 activesupport rows. Their reasons are prose, and none
of them starts with `PERMANENT:`. Together they hide 140 Ruby defs from
`parity:api` and an unmeasured number of tests from `parity:test`.

## Acceptance criteria

- [ ] Reword each row to `PERMANENT: <section>` if it is a ratified limit
      (e.g. `SOLID_STACK_ONLY`, no thread-local storage).
- [ ] File a port story in RFC 0246 for each row that is not a ratified limit.
- [ ] Every activesupport row in the file starts with `PERMANENT:`.
