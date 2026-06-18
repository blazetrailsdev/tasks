---
title: "assoc-has-many-describes-wave7"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `assoc-has-many-describes-wave6` (which converted the
"Association definition" / select-scope describe at
`has-many-associations.test.ts:1729` to canonical `Company`/`Firm`/`Client` +
`Post`/`Comment` fixtures, implemented the faithful
`dangerous association name raises ArgumentError` test, and left
`association keys bypass attribute protection` `it.skip` pending RFC 0030
`canonical-bulb-public-attribute-accessors` — canonical `Bulb` creation throws
`this.readAttribute is not a function`).

Remaining bespoke `defineSchema` blocks in
`packages/activerecord/src/associations/has-many-associations.test.ts` (match
word-for-word to
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`):

- destroying / get-set-ids / clearing describe — ~1016
- size / empty / many? / none? describe — ~1485
- the large `UNIVERSAL_HM_SCHEMA` describe — ~1822 (building/counter-cache/etc.)
- STI build describe — ~7046
- default-scope Car/Bulb (`DEFAULT_SCOPE_SCHEMA`) — ~7268, blocked on RFC 0030
  `canonical-bulb-public-attribute-accessors`
- tail `HasManyAssociationsTestPrimaryKeys` (`TAIL_PRIMARY_KEYS_SCHEMA`, ~7397),
  HMT (`TAIL_HMT_SCHEMA`, ~7454), async (`TAIL_ASYNC_SCHEMA`, ~7748),
  HMT2 (`TAIL_HMT2_SCHEMA`, ~7786), counter-cache head
  (`COUNTER_CACHE_HEAD_SCHEMA`, ~7868)

Key learnings (carried from waves 3-6):

- After `defineSchema(..., { dropExisting: true })`, call
  `await <Model>.loadSchema()` so the STI type-conditions schema cache warms.
- Import canonical models under `Hm`-prefixed aliases so esbuild does not rename
  bespoke same-named classes in sibling (still-unconverted) describes.
- The dangerous-name `ArgumentError` check is already implemented
  (`associations/builder/association.ts:92`); the
  `blazetrails/no-standalone-associations` lint rule forbids
  `Associations.hasMany.call(...)` on a class with no `static {}` block - define
  associations inside the class's `static {}` block.
- Watch for the belongsTo inverse-cache-poisoning deviation
  (`hm-belongsto-inverse-cache-poisoned-after-collection-load`) and the
  `deleteAll` explicit-argument deviation
  (`hm-delete-all-rejects-destroy-dependent`) - skip + reference, don't ratify.

## Acceptance criteria

- [ ] Convert remaining bespoke describes to canonical fixtures + models; test
      names unchanged.
- [ ] No bespoke `defineSchema` left in the file (final PR removes it from
      `eslint/require-canonical-schema-exclude.json`).
- [ ] `pnpm vitest run .../has-many-associations.test.ts` passes on sqlite + postgres.
- [ ] Respect 500 LOC ceiling; split into further waves if needed.
