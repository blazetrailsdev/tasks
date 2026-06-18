---
title: "assoc-has-many-describes-wave6"
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

Follow-up to `assoc-has-many-describes-wave5` (which converted the
dependence/restrict describe at `has-many-associations.test.ts:687` to
canonical `companies`/`accounts` fixtures + `Firm`/`Client`/`Account`/
`RestrictedWithErrorFirm`).

Remaining bespoke `defineSchema` blocks in
`packages/activerecord/src/associations/has-many-associations.test.ts` (match
word-for-word to
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`):

- destroying / size-empty-many-none / select-scope — describes at ~1016, ~1485, ~1729
- the large `UNIVERSAL_HM_SCHEMA` describe (~1822) — building/counter-cache/etc.
- counter-cache head (`COUNTER_CACHE_HEAD_SCHEMA`), STI build (~7046)
- default-scope Car/Bulb (`DEFAULT_SCOPE_SCHEMA`) — blocked on RFC 0030
  canonical-bulb-public-attribute-accessors
- tail `HasManyAssociationsTestPrimaryKeys` (`TAIL_PRIMARY_KEYS_SCHEMA`),
  HMT (`TAIL_HMT_SCHEMA`), async (`TAIL_ASYNC_SCHEMA`), HMT2 (`TAIL_HMT2_SCHEMA`)

Key learnings (carried from wave 3/4/5):

- After `defineSchema(...,{dropExisting:true})`, call `await <Model>.loadSchema()`
  so the schema cache (STI type-conditions) warms.
- Import canonical models under `Hm`-prefixed aliases so esbuild does not rename
  bespoke same-named classes in sibling (still-unconverted) describes.
- Watch for the belongsTo inverse-cache-poisoning deviation
  (`hm-belongsto-inverse-cache-poisoned-after-collection-load`) and the
  `deleteAll` explicit-argument deviation
  (`hm-delete-all-rejects-destroy-dependent`) — skip + reference, don't ratify.

## Acceptance criteria

- [ ] Convert remaining bespoke describes to canonical fixtures + models; test
      names unchanged.
- [ ] No bespoke `defineSchema` left in the file (final PR removes it from
      `eslint/require-canonical-schema-exclude.json`).
- [ ] `pnpm vitest run …/has-many-associations.test.ts` passes on sqlite + postgres.
- [ ] Respect 500 LOC ceiling; split into further waves if needed.
