---
title: "pg-coder-dup-and-composite-dimensions"
status: in-progress
updated: 2026-11-23
rfc: "0186-pg-gem-port"
cluster: "result-and-coders"
packages:
  - "pg"
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#10664
claim: "2026-11-23T19:32:21Z"
assignee: "pg-coder-dup-and-composite-dimensions"
blocked-by: null
closed-reason: null
---

# pg: port Coder#dup and CompositeCoder#dimensions

## Context

RFC 0186 reopened 2026-11-23 for 100% scored `pg` parity. Missing from
`packages/pg/lib/coder.ts`:

- `PG::Coder#dup` (`vendor/pg/v1.6.2/lib/pg/coder.rb:25-29`): `self.class.new(**to_h)`. In trails this is `rbObjDup` plus `initializeDup` / `initializeCopy` (CLAUDE.md, "Fidelity is the job"). Port it at the Rails seam, not as an open-coded copy.
- `PG::CompositeCoder#dimensions` / `#dimensions=` (pg 1.6, C accessors in `vendor/pg/v1.6.2/ext/pg_coder.c`), read by `CompositeCoder#to_h` (`coder.rb:80`, written only when set) and by `inspect` (`:86`)

## Acceptance criteria

- `dimensions` defaults to `nil`, and `setDimensions` checks frozen as the other coder writers do (`pg-coder-writers-check-frozen`).
- `toH` includes `dimensions` only when it is set. `dup` round-trips through `toH`.
- The array encoder and decoder honour `dimensions` as the C coder does. Port the `type_spec.rb` dimensions examples.
- `pnpm parity:api --package pg` shows the three matched.
