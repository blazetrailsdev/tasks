---
title: "test-compare gate extractor: capture respond_to?/supports_X? module wrappers"
status: draft
updated: 2026-06-20
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The test-compare **gate extractor** (`scripts/test-compare/extract-ruby-tests.rb`)
does not capture Ruby module-/method-level capability wrappers, so it reports
the enclosed tests as `unconditional`. This produces **false `over-gated`**
(and, after a naive fix, false `missing-gate`) classifications.

Concrete cases hit by RFC 0032 `gate-over-gated-burndown`:

- `if ActiveRecord::Base.lease_connection.respond_to?(:reset_pk_sequence!)`
  wrapping `def test_reset_*` in `adapter_test.rb` (PG-only) — extractor sees
  unconditional, flags the faithful TS `adapterType !== "postgres"` gate as
  over-gated.
- `if ActiveRecord::Base.lease_connection.savepoint_errors_invalidate_transactions?`
  wrapping `InvalidateTransactionTest` (MySQL-only) — same false over-gated.
- `if supports_views?` wrapping `ViewWithoutPrimaryKeyTest`, whose own
  `def test_*` ARE captured as `features=[views]` while the
  `module ViewBehavior` tests (included into a class under the same `if`) are
  seen as unconditional — an inconsistent split that forced an asymmetric
  TS gate to match.

These were worked around in `gate-over-gated-burndown` by porting the Rails
predicates as TS capability guards / runtime-guard consts (which the TS
extractor treats as incomparable `guards:["unknown"]`). The durable fix is to
teach the Ruby extractor to emit a `guards:[...]` (or feature) gate for these
wrappers so `classifyGateMismatch` compares like-with-like.

## Acceptance criteria

- [ ] `extract-ruby-tests.rb` emits a guard/feature gate for tests enclosed in
      a module-/class-/method-level `if connection.respond_to?(:X)` or
      `if connection.supports_X?` / `supports_X?` wrapper.
- [ ] Tests defined in a `Concern`/module mixed into a class that sits under
      such an `if` inherit the enclosing gate (consistent with the class's own
      `def test_*`).
- [ ] `test:compare --package activerecord --gates` no longer reports the
      reset_pk_sequence / invalidate-transaction / view false positives, and no
      new false `missing-gate` is introduced.
