---
title: "Float#infinite? has no ruby-compat producer, so tests hand-roll it"
status: draft
updated: 2026-09-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `date_test.rb` and `timestamp_test.rb` assertions in
trails#7904.

Rails asserts infinity with the Ruby core predicate `Float#infinite?`
(`vendor/ruby/numeric.c`, `flo_is_infinite_p`), which returns `1`, `-1` or
`nil` — never a boolean:

- `adapters/postgresql/date_test.rb:9,13` —
  `assert_predicate topic.last_read, :infinite?`
- `adapters/postgresql/timestamp_test.rb:131,135` —
  `assert_predicate d.first.updated_at, :infinite?`

ruby-compat has no producer for it: there is no `Float#infinite?` port anywhere
in `packages/ruby-compat/src/`. `BigDecimal#isInfinite`
(`packages/ruby-compat/src/big-decimal.ts:76`) is the only thing in the repo
with those semantics, and it is a BigDecimal method, not the Float one.
`isInfinite` in `packages/activerecord/src/attribute-methods/time-zone-conversion.ts:97`
is a private duck-typed shim, not a seat callers can reach.

So trails#7904 had to hand-roll the predicate twice, once per test file
(`date.test.ts` and `timestamp.test.ts`), each a local
`function infinite(value: unknown): number | null`. Two copies of a Ruby core
method in test files is the shape this bucket exists to retire.

Related but distinct from `float-seat-has-no-producer`, which is about the boxed
Float _rendering_ seat, not this predicate.

## Converged shape

ruby-compat exports the `Float#infinite?` port under the name
`docs/ruby-ts-conventions.md` produces, returning `1 | -1 | null` (never a
boolean, per CLAUDE.md "Predicates" — a Ruby predicate returns a value), and
both PostgreSQL test files call it instead of a local copy.

## Acceptance criteria

- [ ] ruby-compat exports a `Float#infinite?` port returning `1`, `-1` or
      `null`, with unit tests covering all three arms.
- [ ] The local `infinite()` helpers in
      `packages/activerecord/src/adapters/postgresql/date.test.ts` and
      `.../timestamp.test.ts` are deleted in favour of it.
- [ ] `adapters/postgresql/date_test.rb` and
      `adapters/postgresql/timestamp_test.rb` stay at 0 assertion-count, -kind
      and -value mismatches.
