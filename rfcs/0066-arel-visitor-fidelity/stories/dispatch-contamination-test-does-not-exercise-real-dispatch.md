---
title: "dispatch-contamination test hand-rolls a visitor instead of exercising real dispatch fallback"
status: ready
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DispatchContaminationTest` "dispatches properly after failing upwards"
(`vendor/rails/activerecord/test/cases/arel/visitors/dispatch_contamination_test.rb:47-60`)
exercises the real `Visitor` superclass-fallback: an anonymous `Visitor`
subclass defines `visit_Arel_Nodes_Union`/`True`/`False`, accepts a Union
node, and asserts the shared ToSql dispatch is not contaminated
(`node.to_sql` still renders `( TRUE UNION FALSE )` before and after).

trails' port (`packages/arel/src/visitors/dispatch-contamination.test.ts:6-28`)
does not touch the dispatch machinery at all: it hand-rolls a plain
`NodeVisitor` object literal with an `instanceof` chain and asserts on that.
It cannot detect dispatch-cache contamination and does not exercise
`resolveDispatch`'s ancestor fallthrough.

Since PR #5046, `resolveDispatch` implements the `respond_to?` fallthrough
(`visitor.ts` — a class whose own entry names a missing method resolves
upward), so the Rails test's semantics are now portable faithfully: subclass
`Visitor`, register handlers on the subclass's own `dispatchCache()`, accept
a node whose subclass entry is absent, and assert the base `ToSql` cache is
uncontaminated. `visitor.test.ts` already covers fallthrough + memoization
per-class; the missing piece is the cross-visitor contamination assertion
(Rails' actual point: memoization writes to the subclass's cache, never the
parent's shared one).

## Acceptance criteria

- [ ] `dispatch-contamination.test.ts` "dispatches properly after failing
      upwards" drives the real `Visitor` dispatch (subclass + dispatchCache),
      not a hand-rolled object literal.
- [ ] Asserts ToSql output for the same node is unchanged before/after the
      custom visitor accepts it (Rails' contamination assertion).
- [ ] Test name unchanged (matches Rails verbatim).
- [ ] test:compare delta non-negative.
