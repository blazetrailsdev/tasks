---
title: "Convert remaining has-many-associations.test.ts describes to canonical (wave 3)"
status: in-progress
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: 3567
claim: "2026-06-17T19:39:44Z"
assignee: "assoc-has-many-describes-wave3"
blocked-by: null
---

## Context

Follow-up to `assoc-has-many-remaining-describes` (RFC 0019, PR #3482). That
wave converted only the `sti subselect count` describe in
`packages/activerecord/src/associations/has-many-associations.test.ts` to
canonical fixtures/models. ~20 bespoke inline-table `defineSchema` blocks and
ad-hoc `class X extends Base` models remain across the large
`HasManyAssociationsTest` describes (polymorphic, dependence/restrict,
counting/finding/deleting, destroying, size/empty/many/none, select/scope,
default-scope Car/Bulb, STI build, callbacks, counter-cache), the tail
`HasManyAssociationsTestPrimaryKeys` (`cpk_*`/`cpk_asg_*`), async, and HMT2.

Convert each remaining describe onto canonical tables/models matched word-for-word
to `vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.

Known blockers surfaced during PR #3482:

- The default-scope Car/Bulb describe is blocked on canonical `Bulb.create`
  throwing `this.readAttribute is not a function` (tracked separately under
  RFC 0030 canonical-bulb-public-attribute-accessors).
- Shared-DB shape drift: pass `{ schema: TEST_SCHEMA }` to `useHandlerFixtures`
  so canonical table shapes are rebuilt; on PG also clear the prepared-statement
  cache after the rebuild (see the PG cached-plan follow-up story).

## Acceptance criteria

- [ ] Convert remaining describes to canonical fixtures + models; test names unchanged.
- [ ] No `defineSchema` left in the file.
- [ ] In the FINAL PR, remove the file from
      `eslint/require-canonical-schema-exclude.json` (no `eslint-disable`).
- [ ] `pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts` passes on sqlite + postgres.
