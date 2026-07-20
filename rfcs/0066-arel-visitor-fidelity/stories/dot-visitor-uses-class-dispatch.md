---
title: "Dot visitor should class-dispatch raw values via Visitor#visit"
status: done
updated: 2026-07-20
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 13
pr: 5003
claim: "2026-07-20T19:11:43Z"
assignee: "dot-visitor-uses-class-dispatch"
blocked-by: null
closed-reason: null
---

## Context

PR #4990 converged `ToSql`/`Mysql`/`PostgreSQL` raw-value dispatch onto
`Visitor#visit`, which now class-dispatches raw JS values via `rubyClassName`
(`packages/arel/src/visitors/ruby-class.ts`) exactly as Rails' `visit` reads
`object.class` (`vendor/rails/activerecord/lib/arel/visitors/visitor.rb:27-33`).

`packages/arel/src/visitors/dot.ts` was explicitly out of that story's scope and
still carries its own hand-rolled raw-value dispatch chain — see
`dot.ts:495-525`, a `typeof`/duck-type ladder calling `visitString`,
`visitArray`, `visitDate`, `visitDateTime`, `visitTime`, `visitHash` directly,
plus the `visitString` fan-out at `dot.ts:329-379`.

Rails' `Arel::Visitors::Dot` (`vendor/rails/activerecord/lib/arel/visitors/dot.rb`)
defines no such ladder: it inherits `visit` from `Visitor` and relies on the
same class dispatch, with `visit_String`/`visit_Hash`/etc. as ordinary methods
in its own method table. Read `dot.rb` before porting — its handlers render
nodes rather than raising, so the mapping is not identical to `to_sql.rb`.

## Acceptance criteria

- [ ] `dot.ts` raw values dispatch through the inherited `Visitor#visit` class
      dispatch rather than a local `typeof` ladder.
- [ ] The hand-rolled dispatch chain at `dot.ts:495-525` is deleted, or any
      residue is justified against a `dot.rb` anchor.
- [ ] `dot.ts`'s `visit_*` handler set matches `dot.rb`'s (it renders rather
      than raising — do not copy `to_sql.rb`'s `unsupported` aliases).
- [ ] `packages/arel/src/visitors/dot.test.ts` stays green (48 tests).
- [ ] api:compare / test:compare delta non-negative.
