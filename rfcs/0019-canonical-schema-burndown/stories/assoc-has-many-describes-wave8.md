---
title: "assoc-has-many-describes-wave8"
status: claimed
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-18T12:22:07Z"
assignee: "assoc-has-many-describes-wave8"
blocked-by: null
---

## Context

Follow-up to `assoc-has-many-describes-wave7` (which converted the
size/empty/many?/none? describe at
`packages/activerecord/src/associations/has-many-associations.test.ts:1399` to
canonical `Car`/`Bulb` + `Company`/`Firm`/`Client` fixtures, and converged
`CollectionProxy#isEmpty` to read the cached `@association_ids` length instead
of issuing a COUNT — mirroring Rails `empty? → size.zero?`).

Remaining bespoke `defineSchema` blocks in
`packages/activerecord/src/associations/has-many-associations.test.ts` (match
word-for-word to
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`):

- destroying / get-set-ids / clearing describe — ~930 (469 lines; likely needs
  its own wave; uses `clients_of_firm` → `Company`/`Firm`/`Client`)
- the large `UNIVERSAL_HM_SCHEMA` describe — ~1736 (building/counter-cache/etc.;
  ~5200 lines — split across multiple waves)
- STI build describe — ~6960
- default-scope `Car`/`Bulb` (`DEFAULT_SCOPE_SCHEMA`) — ~7182
- tail `HasManyAssociationsTestPrimaryKeys` (`TAIL_PRIMARY_KEYS_SCHEMA`, ~7318),
  HMT (`TAIL_HMT_SCHEMA`, ~7391), async (`TAIL_ASYNC_SCHEMA`, ~7667),
  HMT2 (`TAIL_HMT2_SCHEMA`, ~7707), counter-cache head
  (`COUNTER_CACHE_HEAD_SCHEMA`, ~7787)

Key learnings (carried from waves 3-7):

- Canonical `Car`/`Bulb` creation now works (the
  `this.readAttribute is not a function` blocker from wave6 is resolved); use
  `defineSchema(Base.connection, { cars: TEST_SCHEMA.cars, bulbs:
TEST_SCHEMA.bulbs }, { dropExisting: true })` + `await Car.loadSchema()` /
  `Bulb.loadSchema()`.
- After `defineSchema(..., { dropExisting: true })`, call `await
<Model>.loadSchema()` so the STI type-conditions schema cache warms.
- Import canonical models under `Hm`-prefixed aliases so esbuild does not rename
  bespoke same-named classes in sibling (still-unconverted) describes.
- Watch for the belongsTo inverse-cache-poisoning deviation
  (`hm-belongsto-inverse-cache-poisoned-after-collection-load`) and the
  `deleteAll` explicit-argument deviation
  (`hm-delete-all-rejects-destroy-dependent`) — skip + reference, don't ratify.

## Acceptance criteria

- [ ] Convert remaining bespoke describes to canonical fixtures + models; test
      names unchanged.
- [ ] No bespoke `defineSchema` left in the file (final wave removes it from
      `eslint/require-canonical-schema-exclude.json`).
- [ ] `pnpm vitest run .../has-many-associations.test.ts` passes on sqlite + postgres.
- [ ] Respect 500 LOC ceiling; split into further waves if needed.
