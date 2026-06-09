---
title: "P3 — PG enum ORM + schema-dump/load scoped to schemas (5 skips)"
status: draft
updated: 2026-06-09
rfc: "0000-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of `p3-pg-optimizer-hints-and-enum` (PR #TBD shipped the 5
optimizer-hints skips; the enum half exceeded the 300-LOC ceiling and needs
real ORM + schema-dumper work). Mirrors Rails
`test/cases/adapters/postgresql/enum_test.rb`.

The 5 remaining hard `it.skip` entries in
`packages/activerecord/src/adapters/postgresql/enum.test.ts`:

1. **`invalid enum update`** — `enum.current_mood = "angry"` must raise
   `ArgumentError`. Blocked: the string-enum attribute setter does not call
   `EnumType.assertValidValue` (declared at `enum.ts` but unwired). Also needs
   the `PostgresqlEnum` test model to actually declare the enum DSL with string
   values + `prefix: true` (`enum :current_mood, { sad: "sad", okay: "ok",
happy: "happy", aliased_field: "happy" }, prefix: true`). The public
   `enumMethod` macro currently types `mapping` as `Record<string, number>`;
   string values work at runtime via `_enum` but the public surface must be
   widened (or the test casts). ~5 LOC enum fix + test model decl.
2. **`works with activerecord enum`** — exercises the generated bang
   (`current_mood_okay!`) and predicate (`current_mood_happy?`) methods plus the
   label-returning getter (`"ok"` DB value → `"okay"` label). Verify the
   generated method names (our port emits `current_mood_okayBang` /
   `isCurrent_mood_happy`) and the cast/deserialize round-trip. ~3 LOC getter +
   test model decl.
3. **`no oid warning`** — needs a vitest equivalent of Ruby `capture(:stderr)`
   to assert no warning is emitted. Blocked on stderr-capture infra (no
   `process.*` per repo rules — needs a console/stderr hook helper).
4. **`schema dump scoped to schemas`** — `dump_all_table_schema` must filter
   enums by the search-path so only visible enums dump (`public.mood`,
   `mood_in_test_schema`) and `other_schema.mood_in_other_schema` is excluded.
   ~20 LOC in the PG schema-dumper `types()`.
5. **`schema load scoped to schemas`** — `Schema.define` inside a non-default
   `search_path` must invalidate the schema cache so stale OID mappings don't
   leak across search-path switches. Schema-cache invalidation work.

Also verify the 2 `it.skipIf(pgServerVersion < 100000)` entries (`schema dump
added enum value` / `schema dump renamed enum value`) still pass on PG 10+ —
they already pass on PG 17 today; leave them as `skipIf`.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane`. Run:
`ARCONN=postgresql PG_TEST_URL=… pnpm vitest run
packages/activerecord/src/adapters/postgresql/enum.test.ts`.
A plain `postgres:17` container suffices (no extension needed). Multi-schema
tests rely on `createSchema`/`setSchemaSearchPath`/`dropSchema`, already on the
PG adapter.

## Acceptance criteria

- [ ] All 5 hard `it.skip` entries in `enum.test.ts` un-skipped and passing
      (or `no oid warning` kept skipped with a documented infra blocker + a
      follow-up note if stderr capture is out of scope).
- [ ] The 2 `skipIf(pgServerVersion < 100000)` entries verified passing on PG 10+.
- [ ] No regression in the existing 14 passing enum tests.
- [ ] String-enum DSL changes (if exposed publicly) keep `api:compare` green.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.
