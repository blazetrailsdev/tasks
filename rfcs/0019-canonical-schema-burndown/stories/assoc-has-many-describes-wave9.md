---
title: "assoc-has-many-describes-wave9"
status: done
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3582
claim: "2026-06-18T12:52:08Z"
assignee: "assoc-has-many-describes-wave9"
blocked-by: null
---

## Context

Follow-up to `assoc-has-many-describes-wave8` (which converted the
default-scope `Car`/`Bulb` describe — formerly `DEFAULT_SCOPE_SCHEMA` at
`packages/activerecord/src/associations/has-many-associations.test.ts:~7177` —
to canonical `Car`/`Bulb` models + `cars`/`bulbs` from `TEST_SCHEMA`. The
canonical `Car` already declares `bulbs`/`allBulbs`/`otherBulbs`/`oldBulbs`
with the exact reflection scopes Rails uses, and `Bulb` has
`default_scope { where(name: "defaulty") }`, so the three "can unscope / unscope
and where / rewhere the default scope of the associated model" tests
(Rails `has_many_associations_test.rb:2822-2849`) map 1:1).

Remaining bespoke `defineSchema` blocks in
`has-many-associations.test.ts` (match word-for-word to
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`):

- HEAD_SCHEMA head describes - ~477
- destroying / get-set-ids / clearing describe - ~930 (bespoke authors/posts via
  loadHasMany; large)
- size/empty `size_un_*`/`empty_*` describe - ~1399
- the large `UNIVERSAL_HM_SCHEMA` describe - ~1736 (building/counter-cache/etc.;
  thousands of lines - split across multiple waves)
- STI build describe - ~6960
- tail `HasManyAssociationsTestPrimaryKeys` (`TAIL_PRIMARY_KEYS_SCHEMA`),
  HMT (`TAIL_HMT_SCHEMA`), async (`TAIL_ASYNC_SCHEMA`),
  HMT2 (`TAIL_HMT2_SCHEMA`), counter-cache head (`COUNTER_CACHE_HEAD_SCHEMA`)

Key learnings (carried from waves 3-8):

- For canonical `Car`/`Bulb`: `defineSchema(Base.connection, { cars:
TEST_SCHEMA.cars, bulbs: TEST_SCHEMA.bulbs }, { dropExisting: true })` then
  `await Car.loadSchema()` / `Bulb.loadSchema()`. Note `bulbs.ID` is the PK
  (uppercase); the freshly-created instance does NOT reflect the autoincrement
  PK back onto `.ID`, so assert on a stable attribute (e.g. `name`) rather than
  the created record's id.
- Import canonical models under `Hm`-prefixed aliases so esbuild does not rename
  bespoke same-named classes in sibling (still-unconverted) describes.
- Watch for the belongsTo inverse-cache-poisoning deviation and the `deleteAll`
  explicit-argument deviation - skip + reference, don't ratify.

## Acceptance criteria

- [ ] Convert further bespoke describes to canonical fixtures + models; test
      names unchanged.
- [ ] `pnpm vitest run .../has-many-associations.test.ts` passes on sqlite + postgres.
- [ ] Respect 500 LOC ceiling; split into further waves if needed. The final
      wave removes the file from
      `eslint/require-canonical-schema-exclude.json` once no bespoke
      `defineSchema` remains.
