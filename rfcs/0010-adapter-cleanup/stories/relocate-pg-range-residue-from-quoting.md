---
title: "Relocate residual PG encodeRange helper out of postgresql/quoting.ts"
status: claimed
updated: 2026-06-13
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 22
pr: null
claim: "2026-06-13T00:32:00Z"
assignee: "relocate-pg-range-residue-from-quoting"
blocked-by: null
---

## Context

Follow-up to trails #3141 (`relocate SQL datetime serializers out of
quoting.ts`), which moved non-Rails-counterpart serialization helpers out of
the quoting modules so each `quoting.ts` mirrors its Rails
`connection_adapters/<adapter>/quoting.rb` file method-for-method.

One residue remains: `encodeRange(range: Range): string` at
`packages/activerecord/src/connection-adapters/postgresql/quoting.ts:391`.
Rails has no `encode_range` in `postgresql/quoting.rb` — range
serialization lives in the OID type
(`activerecord/lib/active_record/connection_adapters/postgresql/oid/range.rb`,
`#serialize` / `Range#to_postgres` style formatting). Keeping it in quoting.ts
pollutes the file-level api:compare mapping and invites callers to treat it as
a quoting concern.

Work: move `encodeRange` next to the PG range OID type
(`connection-adapters/postgresql/oid/range.ts` or a sibling helper module the
type owns), update the import sites (grep `encodeRange` — currently quoting.ts
is the only non-test definition site), and keep the function `@internal` (it
has no Rails public counterpart).

## Acceptance criteria

- [ ] `postgresql/quoting.ts` contains no `encodeRange`; the helper lives with
      the range OID type and callers import from there.
- [ ] No behavior change: `adapters/postgresql/range.test.ts` passes locally
      (PG via `pnpm db:up`); no test renames.
- [ ] `pnpm api:compare --package activerecord` stays at 100% (no new
      misplaced/extra methods on the quoting file).
