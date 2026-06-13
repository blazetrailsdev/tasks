---
title: "Relocate residual PG encodeRange helper out of postgresql/quoting.ts"
status: done
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

## Resolution (closed without code change — invalid premise)

Closed **done, no PR**. The story's premise is false against the project's
parity target. The vendored Rails (`vendor/sources.lock.json` → **rails
v8.0.2**, the api:compare source of truth) defines `encode_range`,
`type_cast_range_value`, and `infinity?` as **private methods of
`ActiveRecord::ConnectionAdapters::PostgreSQL::Quoting`** in
`connection_adapters/postgresql/quoting.rb` (lines 210/228/232). They are
counted by `api:compare` — the existing TS `encodeRange` / `typeCastRangeValue`
/ `isInfinity` in `postgresql/quoting.ts` are their matched counterparts, and
the file sits at 100%.

This makes acceptance criteria #1 and #3 mutually exclusive: relocating
`encodeRange` out of `quoting.ts` drops the file from **100% → 87%** (3 missing
methods: `encode_range`, `type_cast_range_value`, `infinity?`), directly
violating #3 ("api:compare stays at 100%"). Verified empirically — performing
the move produced exactly that regression; reverted.

`encodeRange` is therefore _not_ residue: it correctly mirrors a real Rails
8.0.2 private quoting method and belongs in `quoting.ts`. (Note the predicate
path actually serializes ranges via `Range#toString`, so `encodeRange` is
currently uncalled — but removing/relocating it is a separate question from
this story and would still break parity unless Rails upstream moves it.)

If the RFC owner still wants this, the prerequisite is upstream: confirm a
Rails version where `encode_range` lives on `OID::Range` rather than
`PostgreSQL::Quoting`, then re-vendor — out of scope for a ~60 LOC cleanup.
