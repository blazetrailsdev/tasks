---
title: "assoc-has-many-describes-wave5"
status: in-progress
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3574
claim: "2026-06-18T01:52:06Z"
assignee: "assoc-has-many-describes-wave5"
blocked-by: null
---

## Context

Follow-up to `assoc-has-many-describes-wave4` (PR converting the polymorphic
describe at `has-many-associations.test.ts:601`). Wave 4 converted the
polymorphic block (depends-and-nullify, joining-through, build-with-polymorphic,
build-from-polymorphic, attributes-set-from-null) to canonical
`Post`/`Comment`/`Tag`/`Tagging`/`Human`/`Category`/`TypedEssay`/
`PersonWithPolymorphicDependentNullifyComments` + the `posts`/`comments`/
`humans`/`categories`/`essays`/`tags`/`taggings`/`people` fixtures.

Remaining bespoke `defineSchema` blocks in
`packages/activerecord/src/associations/has-many-associations.test.ts` (match
word-for-word to
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`):

- dependence / restrict (`dep_*`, `firms`/`dep_accounts`, `re_*`) — describe at ~692
- destroying / size-empty-many-none / select-scope — describes at ~1021, ~1490, ~1734
- the large `UNIVERSAL_HM_SCHEMA` describe (~1828–7050) — building/counter-cache/etc.
- counter-cache head (~7879), STI build (~7060)
- default-scope Car/Bulb (`DEFAULT_SCOPE_SCHEMA`, ~7273) — blocked on RFC 0030
  canonical-bulb-public-attribute-accessors
- tail `HasManyAssociationsTestPrimaryKeys` (`cpk_*`/`cpk_asg_*`, ~7410),
  HMT (~7483), async (~7759), HMT2 (~7799)

Key learnings (carried from wave 3/4):

- After `defineSchema(...,{dropExisting:true})` or `useHandlerFixtures(...,{schema})`,
  call `await <Model>.loadSchema()` so the schema cache warms (STI type-conditions
  silently don't apply otherwise).
- Import canonical models under `Hm`-prefixed aliases so esbuild does not rename
  bespoke same-named classes in sibling (still-unconverted) describes.
- For polymorphic `as:` has_many first-or-initialize, call
  `firstOrInitialize({...})` directly on the proxy (not via a chained `.where()`
  relation) — the relation path does not apply the association's polymorphic
  scope-for-create type column.

## Acceptance criteria

- [ ] Convert remaining bespoke describes to canonical fixtures + models; test names unchanged.
- [ ] No bespoke `defineSchema` left in the file.
- [ ] In the FINAL PR, remove the file from `eslint/require-canonical-schema-exclude.json`.
- [ ] Un-skip the three `clients_of_firm` delete tests once `hm-clients-of-firm-delete-async-validate` lands.
- [ ] `pnpm vitest run …/has-many-associations.test.ts` passes on sqlite + postgres.
- [ ] Respect 500 LOC ceiling; split into further waves if needed (register new stories).
