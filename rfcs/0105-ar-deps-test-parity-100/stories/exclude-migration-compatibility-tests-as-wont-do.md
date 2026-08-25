---
title: "Exclude migration/compatibility_test.rb as won't-do (Migration[x.y] is not a trails goal)"
status: done
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: boundary-and-measurement
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 90
priority: 1
pr: 6505
claim: "2026-08-14T02:27:09Z"
assignee: "derive-ar-closure-test-manifest"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/migration/compatibility_test.rb` is 57
tests and is ActiveRecord's single largest remaining test-gate gap (of the
package's 181 remaining, 169 are `migration/*` and this file is a third of the
whole package gap).

It cannot be ported, by maintainer decision rather than by technical
limitation: `ActiveRecord::Migration[x.y]` / `Migration::Compatibility::V*`
exists so migrations written under an old Rails version keep behaving as
written, and trails has no old versions. PR #5070 shipped a complete, CI-green,
review-clean `Migration[6.1]` / `Compatibility::V6_1` implementation and was
closed **unmerged** on 2026-07-22 — "the premise of this pr is not the goal of
trails. We have no backwards compatibility necessary since there never were
previous versions of trails." RFC 0030's story
`c1-schema-dumper-migration-version-compat` was closed on the same grounds. The
thin registry at `packages/activerecord/src/migration/compatibility.ts`
(version "1.0" only) stays; nothing gets added to it.

This is the one exclusion this RFC sanctions, and the README states the test a
reviewer applies: _does the trails surface exist or is it intended to?_ Here the
answer is a documented no, which is the opposite of the fixtures row (where the
surface shipped and the exclusion reason went stale).

## Acceptance criteria

- One entry in `scripts/parity/unported-files/` (activerecord-scoped, anchored
  `testFile`) for `migration/compatibility_test.rb`, whose reason cites PR #5070
  and the closed RFC 0030 story — not a generic "not portable".
- The entry excludes that file and nothing else: verify with
  `pnpm parity:test -- --package activerecord` that `total` drops by exactly 57
  and no other file's counts move.
- The PR body states the new activerecord denominator and percent explicitly, so
  the scoreboard movement is attributable.
- No other registry row is added, widened, or reworded.
