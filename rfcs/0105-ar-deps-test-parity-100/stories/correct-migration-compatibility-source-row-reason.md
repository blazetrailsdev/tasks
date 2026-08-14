---
title: "Correct the migration/compatibility source row: false SKIP_PATTERNS comment and stale pre-1.0 reason"
status: done
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6516
claim: "2026-08-14T12:07:07Z"
assignee: "read-association-scope-off-reflection-not-definition-bag"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files/unscoped.ts:11-14` is the source-side row for
migration compatibility:

```ts
{
  pattern: "migration/compatibility", // test excluded by extract-ruby-tests.rb SKIP_PATTERNS (/\/migration\//)
  reason: "Pre-1.0: legacy Rails version migration compatibility shims.",
}
```

Two defects, both found while landing PR #6505
(`exclude-migration-compatibility-tests-as-wont-do`):

1. **The trailing comment is false.** It claims the Rails test file is already
   excluded by a `SKIP_PATTERNS` `/\/migration\//` rule in
   `scripts/test-compare/extract-ruby-tests.rb`. It is not:
   `vendor/rails/activerecord/test/cases/migration/compatibility_test.rb` was
   counted in full (57 tests) until #6505 added an explicit anchored `testFile`
   row for it. A comment asserting a mechanism that does not exist is worse
   than no comment — it tells the next reader not to check.
2. **The reason is a scope label, not a decision.** "Pre-1.0: legacy Rails
   version migration compatibility shims" reads as deferred work. It is not
   deferred: `ActiveRecord::Migration[x.y]` /
   `Migration::Compatibility::V*` (vendor/rails/activerecord/lib/active_record/migration/compatibility.rb:1)
   exists so migrations written under an older Rails keep behaving as written,
   and trails has no older versions. PR #5070 shipped a complete, CI-green
   `Migration[6.1]` / `Compatibility::V6_1` and was closed unmerged on
   2026-07-22 — "the premise of this pr is not the goal of trails. We have no
   backwards compatibility necessary since there never were previous versions
   of trails." RFC 0030's `c1-schema-dumper-migration-version-compat` closed on
   the same grounds. The test-side row added in #6505 already carries that
   citation; the source-side row still does not.

This is the same failure mode RFC 0105's README names for the fixtures row: an
exclusion reason that goes stale and then hides work behind a label nobody
re-reads.

## Acceptance criteria

- The false `SKIP_PATTERNS` comment is deleted (or replaced with what actually
  excludes the test — the anchored `testFile` row added by #6505).
- The row's `reason` states the won't-do decision and cites PR #5070 and the
  closed RFC 0030 story, matching the test-side row.
- `pnpm parity:api` and `pnpm parity:test` numerators and denominators are
  unchanged: this is a reason/comment correction, not a scope change. Verify
  the source pattern still matches only
  `activerecord/lib/active_record/migration/compatibility.rb`.
- If the `reason` is edited, mirror it in
  `scripts/parity/unported-files/baseline.json` in the same commit, by hand
  (the only-shrink snapshot test at `scripts/parity/unported-files.test.ts:131`
  compares entries byte-for-byte).
