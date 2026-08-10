---
title: "converge-is-touching-suppressed-to-no-touching-predicate"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5923
claim: "2026-08-02T20:49:25Z"
assignee: "converge-is-touching-suppressed-to-no-touching-predicate"
blocked-by: null
closed-reason: null
---

## Context

Classified by `extra-surface-base-accessors-classify` as a category (c)
misplaced-and-renamed port.

`packages/activerecord/src/base.ts:1735` declares
`static get isTouchingSuppressed()`, delegating to `isAppliedTo` in
`packages/activerecord/src/no-touching.ts:37`.

Rails' counterpart is an **instance** predicate, `no_touching?`, at
`vendor/rails/activerecord/lib/active_record/no_touching.rb:53`, whose body is
`NoTouching.applied_to?(self.class)`. Rails' own test asserts it on a record,
not a class: `assert_predicate @developer, :no_touching?`
(`vendor/rails/activerecord/test/cases/timestamp_test.rb:155`).

trails made it a class-level getter under an invented name, and the ported test
followed: `packages/activerecord/src/timestamp.test.ts:221` asserts
`Developer.isTouchingSuppressed` where Rails asserts `@developer.no_touching?`.
So this is both a receiver divergence and a name divergence.

Verified: `grep -rn "def touching_suppressed?" vendor/rails` returns nothing.

Note `no-touching.ts` already exports `isNoTouching()` (line 51), so the target
name needs checking against what is already there before landing.

## Acceptance criteria

- Port `no_touching?` as an **instance** predicate on the record, sourced from
  `no-touching.ts`, matching no_touching.rb:53 (receiver and body).
- Retire the `Base.isTouchingSuppressed` static getter.
- Update `timestamp.test.ts` assertions to use the record receiver, matching
  timestamp_test.rb:155-197. NO test renames.
- Reconcile with the existing `no-touching.ts:51` `isNoTouching()` export so
  the file does not end up with two spellings of one Ruby method.
- `base.ts` drops one novel extra; record before/after in the PR body.
- Re-run `pnpm parity:api:calls`.
