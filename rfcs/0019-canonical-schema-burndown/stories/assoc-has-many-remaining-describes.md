---
title: "Convert remaining has-many-associations.test.ts describes to canonical (waves 2+)"
status: done
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["assoc-has-many"]
deps-rfc: []
est-loc: 500
priority: null
pr: 3482
claim: "2026-06-16T16:48:31Z"
assignee: "assoc-has-many-remaining-describes"
blocked-by: null
---

## Context

Follow-up to `assoc-has-many` (RFC 0019). That story converts
`packages/activerecord/src/associations/has-many-associations.test.ts`
(~8300 LOC, originally 398 inline tables) to the canonical schema. The file is
multi-PR: the first wave converted the head `HasManyAssociationsTestPrimaryKeys`
describe to `useHandlerFixtures(["authors","authorAddresses","essays",
"subscribers","subscriptions","people"])` + canonical `Author`/`Essay`/`Person`/
`Subscriber`/`Subscription` models (no `defineSchema`).

The remaining describes still use bespoke inline-table `defineSchema` blocks and
ad-hoc `class X extends Base` models. They must be converted per-describe onto
canonical tables/models matched word-for-word to
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.

Remaining describe blocks (non-exhaustive; see file): the large
`HasManyAssociationsTest` blocks (polymorphic, dependence/restrict, counting/
finding/deleting, destroying, size/empty/many/none, select/scope, default-scope,
STI build, callbacks), the tail `HasManyAssociationsTestPrimaryKeys`
(`cpk_*`/`cpk_asg_*`), default-scope, HMT, async, and HMT2 describes.

`deps`: this story's head wave PR must merge first (establishes the canonical
imports + fixture wiring at the top of the file).

## Acceptance criteria

- [ ] Convert each remaining describe to canonical fixtures + models, porting
      bodies word-for-word from the Rails file; test names unchanged.
- [ ] No `defineSchema` left in the file; add columns to
      `test-helpers/test-schema.ts` only when Rails `schema.rb` has them.
- [ ] Split across sibling PRs off `main` (non-overlapping describes, NOT
      stacked), each <=500 LOC.
- [ ] In the FINAL PR, remove the file from
      `eslint/require-canonical-schema-exclude.json` once it lint-passes with no
      `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts` passes.
