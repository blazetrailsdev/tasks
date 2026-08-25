---
title: "Measure the real fixtures gap once the stale exclusion lifts"
status: ready
updated: 2026-08-13
rfc: "0105-ar-deps-test-parity-100"
cluster: name-gap
packages:
  - "activerecord"
deps:
  - "reenroll-fixtures-tests-stale-unported-exclusion"
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0023's `reenroll-fixtures-tests-stale-unported-exclusion` removes the three
stale rows at `scripts/parity/unported-files/unscoped.ts:77-99` and returns 172
Rails tests to activerecord's denominator —
`vendor/rails/activerecord/test/cases/fixtures_test.rb` (153),
`fixture_set/file_test.rb` (14), `test_fixtures_test.rb` (5). AR's percent drops
from 97.9% to ≈96.0% the moment it lands, which is the intended and honest
direction: the trails surface shipped (`packages/activerecord/src/fixtures.ts`,
1,461 LOC; `test-fixtures.ts`, 584; the 133-entry corpus under
`test-helpers/fixtures/`; `fixtures({ … })` is CLAUDE.md's canonical test
surface), so those tests belong in the denominator.

What nobody knows yet is how many of the 172 are _actually_ missing. Our side
already holds 93 `it(...)` cases across `packages/activerecord/src/fixtures.test.ts`
(32), `test-fixtures.test.ts` (55) and `naked-fixtures.test.ts` (6), and
test-compare matches on normalized names — a large share may credit on first
enrollment. Sizing the porting work before measuring would be guesswork, so this
story measures and files, and the two porting stories that follow it are
re-scoped from its output.

The RFC 0023 story is a cross-RFC `deps` edge, not `deps-rfc`: `deps-rfc` blocks
until the named RFC reaches `status: closed`, and `0023-surfaced-deviations` is a
standing catch-all that never closes, so it would park this story forever. Story
ids resolve globally in the dep graph (`scripts/validate-lib.mjs:86-110` builds
`storyIds` across every RFC), and cross-RFC `deps` edges are established practice
in this repo, so the edge is both legal and enforced by `pnpm tasks ready`.

## Acceptance criteria

- Run against a tree with the RFC 0023 re-enrollment applied and report, per
  Rails file, matched / missing / misplaced and the exact list of missing test
  names.
- Identify the cases that cannot port at all (Ruby `ERB` preprocessing inside
  fixture YAML, `Marshal` round-trips) and propose case-level `tests:`
  exclusions with reasons — the count of those is part of the deliverable.
- Re-scope `port-fixtures-test-cases-first-half` /
  `-second-half` /
  `port-fixture-set-file-and-test-fixtures-cases` against the measurement
  (`pnpm tasks edit`), or close whichever turns out to be unnecessary.
- Analysis + story edits only; no test-source changes in this PR.
