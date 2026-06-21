---
title: "increment-bang-persists-db-diff"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T14:54:42Z"
assignee: "increment-bang-persists-db-diff"
blocked-by: null
---

## Context

Surfaced reviewing PR #3798 (persistence-increment-decrement-reload-fidelity).

Rails `ActiveRecord::Persistence#increment!` persists the **difference between
the current in-memory value and the value in the database**, not the raw `by`
offset:

    # vendor/rails/activerecord/lib/active_record/persistence.rb
    def increment!(attribute, by = 1, touch: nil)
      increment(attribute, by)
      change = public_send(attribute) - public_send(:"#{attribute}_in_database")
      self.class.update_counters(id, attribute => change, touch: touch)
      public_send(:"clear_#{attribute}_change")
      self
    end

trails' `incrementBang` (packages/activerecord/src/persistence.ts:439-455)
instead calls `updateCounters(this.id, { [attribute]: by })` with the raw `by`.
For a bare `increment!` these are equal (in_database == current value before the
increment). They diverge for Rails' **chained** form
`increment(:x).increment!(:x)`: Rails accumulates the prior in-memory
`increment` into `change` (so the DB advances by 2), while trails advances the
DB by only `by` (1).

This blocks faithfully porting the chained assertions in
`persistence_test.rb:291-330` (test_increment_attribute,
test_increment_attribute_by, test_decrement_attribute,
test_decrement_attribute_by all use the chained form on their second/third
lines). PR #3798 ported only the bare bang+reload assertions for this reason.

Repro: chained `await t.increment("replies_count").incrementBang("replies_count")`
then `reload()` yields DB = +1 over baseline; Rails yields +2.

## Acceptance criteria

- [ ] `incrementBang` computes `change = current - <attribute>_in_database` and
      passes that to `updateCounters`, matching Rails persistence.rb.
- [ ] Restore the chained `increment(...).increment!(...)` assertion lines in the
      four persistence.test.ts increment/decrement tests so they mirror
      persistence_test.rb:291-330 in full.
- [ ] api:compare / test:compare delta non-negative; lint + typecheck clean.
