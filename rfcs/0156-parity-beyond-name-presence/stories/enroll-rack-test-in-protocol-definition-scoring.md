---
title: "enroll-rack-test-in-protocol-definition-scoring"
status: ready
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PROTOCOL_DEFINITION_NAMES` (`scripts/parity/conventions.ts`) — `inspect`, `pretty_print`, `dup`, `initialize_copy`, `initialize_dup`, `encode_with`, `init_with`, `to_a`, `to_h`, `to_hash` — are scored per definition only in packages listed in `PROTOCOL_DEFINITION_ENROLLED_PACKAGES` (only-grow, RFC 0156, story `unskip-ported-protocol-names-per-definition`). `rack-test` is not enrolled: enrolling it today would add the rows and gate failures below, measured by adding `"rack-test"` to the set and running `pnpm parity:api --calls` plus every `parity:api:*` gate on `6d3bbba411`.

Newly missing rows (reported, never baselined):

- none

Gate failures with the package enrolled:

- `parity:api:calls`: `cookie-jar.ts` `to_h` omits `merge`

## Acceptance criteria

- Each gate failure above is converged in the TS body (make the call Rails makes, rename to the Rails identifier) — no baseline row, no raised mark.
- `"rack-test"` is added to `PROTOCOL_DEFINITION_ENROLLED_PACKAGES` and every `parity:api:*` gate is green.
- The newly missing rows stay reported as missing; porting them is not required to enroll.
