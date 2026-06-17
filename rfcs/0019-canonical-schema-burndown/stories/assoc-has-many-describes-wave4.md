---
title: "assoc-has-many-describes-wave4"
status: in-progress
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3568
claim: "2026-06-17T20:12:14Z"
assignee: "assoc-has-many-describes-wave4"
blocked-by: null
---

## Context

Follow-up to `assoc-has-many-describes-wave3` (PR pending). Wave 3 converted the
`counting/finding/deleting` describe (the `authors/posts` bespoke block,
`has-many-associations.test.ts:918` region) onto canonical
`Company`/`Firm`/`Client` + `Developer`/`Project` models and the `companies`/
`developers`/`projects`/`developers_projects` fixtures. The remaining ~18
`defineSchema` blocks in
`packages/activerecord/src/associations/has-many-associations.test.ts` are still
bespoke and must be converted, matched word-for-word to
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`:

- polymorphic (`HasManyAssociationsTest:589`: depends-and-nullify, joining-through,
  build-with-polymorphic, build-from-polymorphic, attributes-set-from-null)
- dependence/restrict (`dep_*`, `firms`/`dep_accounts`, `re_*`)
- destroying / size-empty-many-none / select-scope
- default-scope Car/Bulb (blocked on RFC 0030 canonical-bulb-public-attribute-accessors)
- STI build, callbacks, counter-cache
- tail `HasManyAssociationsTestPrimaryKeys` (`cpk_*`/`cpk_asg_*`), async, HMT2

Key learnings from wave 3:

- After `defineSchema(conn, {…}, {dropExisting:true})`, call
  `await <CanonicalBaseModel>.loadSchema()` so the schema cache warms — otherwise
  `columnNames()` returns only declared attributes and STI type-conditions
  (`finder_needs_type_condition?`) silently don't apply.
- Import canonical models under `Hm`-prefixed aliases (the file's existing
  convention) so esbuild doesn't rename bespoke same-named classes in sibling
  describes and break their inferred table names.
- The `blazetrails/test-fixture-parity` lint rule requires test bodies whose
  Rails counterpart uses `companies(:first_firm)` etc. to actually call the
  fixture accessor; destructure it from `useHandlerFixtures`.

## Acceptance criteria

- [ ] Convert remaining describes to canonical fixtures + models; test names unchanged.
- [ ] No `defineSchema` left in the file.
- [ ] In the FINAL PR, remove the file from `eslint/require-canonical-schema-exclude.json`.
- [ ] Un-skip the three `clients_of_firm` delete tests once
      `hm-clients-of-firm-delete-async-validate` lands.
- [ ] `pnpm vitest run …/has-many-associations.test.ts` passes on sqlite + postgres.
