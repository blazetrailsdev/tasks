---
title: "converge-fixtures-test-grouped-one-off-exclusions"
status: in-progress
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7682
claim: "2026-09-10T23:31:39Z"
assignee: "contact-test-model-extends-model-where-rails-is-a-plain-class"
blocked-by: null
closed-reason: null
---

## Context

PR #7652 grouped four unrelated `FixturesTest` exclusions into one row in
`scripts/parity/unported-files/unscoped.ts`. Review established that at least
two of them name surfaces trails already has, so the row is hiding convergeable
work behind a shared reason. Each needs porting, or its own specific row.

- **`auto value on primary key`** (`vendor/rails/activerecord/test/cases/fixtures_test.rb:335-346`)
  calls `conn.insert_fixtures_set({ "aircraft" => fixtures }, ["aircraft"])` with
  a POSITIONAL array of rows carrying no ids, then asserts
  `select_all("SELECT name, wheels_count FROM aircraft ORDER BY id")` round-trips
  them — i.e. the database assigned the primary keys. trails HAS
  `insertFixturesSet` (`fixtures.ts`, via
  `connection-adapters/abstract/database-statements.ts`); what it lacks is a
  label-free entry point, since `prepareModelFixtures` keys rows by label.
- **`logger level invariant`** (`:494-503`) swaps `ActiveRecord::Base.logger` for
  `ActiveSupport::Logger.new(nil)`, loads fixtures, and asserts the logger's
  `level` is unchanged. `Base.logger` and a `Logger` with a `level` both exist in
  trails.
- **`insert with default function`** (`:480-485`) asserts a `CURRENT_TIMESTAMP`
  column default lands within 1.1s of `Time.now`. The blocker is reading that
  value back through the attribute reader consistently across sqlite / PG /
  MySQL, which is a real gap worth pinning rather than a language limit.
- **`binary in fixtures`** (`:592-598`) reads `ASSETS_ROOT + "/flowers.jpg"` with
  `File.binread` and compares it to `@flowers.data`. This one needs a binary
  asset in the repo and an async-fs read; it is the least convergeable of the
  four.

## Converged shape

Port each case that can be ported and DELETE it from the grouped row; whatever
genuinely cannot port gets its OWN row with its OWN specific reason naming the
missing surface, never a shared four-case reason.

## Acceptance criteria

- `auto value on primary key` and `logger level invariant` are ported at their
  Rails names and pass on all three lanes.
- `insert with default function` is either ported or carries a row naming the
  precise cross-adapter read that blocks it.
- `binary in fixtures` is either ported or carries its own row.
- The four-case grouped row no longer exists in
  `scripts/parity/unported-files/unscoped.ts`.
