---
title: "Sweep activemodel's and activesupport's namespace seats to plain assignments"
status: draft
updated: 2026-10-22
rfc: "0000-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

activemodel holds 34 seats (7 in tests) onto `ActiveModel`,
`ActiveModel::Serializers` and `Validations`; activesupport holds 16 onto
`ActiveSupport`, `Concurrent` and `TopLevel`.
`activemodel/src/attribute.ts` is, with arel, one of the two places already
converged to the helper, so it is a seat-for-seat reversal.

Three seats keep the helper, all activesupport:
`ClassMethods` (`active_support/concern.rb:212`), a `concerning` topic
(`core_ext/module/concerning.rb:133`), and a stubbed constant
(`testing/constant_stubbing.rb:33-45`). activemodel keeps one: the `ATTR_`
name constant (`active_model/attribute_methods.rb:584`,
`const_set(const_name, attr_name) unless const_defined?(const_name)`).

`TopLevel` is Ruby's top-level `Object`
(`packages/activesupport/src/namespaces.ts`); a seat onto it keeps whatever
`registerConstant` behaviour the top-level table needs — read
`rbModConstSet`'s `mod === Object` arm (`include.ts:117-120`) before
rewriting one, since the derivation must answer a bare `"Trails"` there, not
`"Object::Trails"`.

Mechanical sweep. Each seat `rbModConstSet(Owner, "Name", Klass);` becomes
`Owner.Name = Klass;`, and the `rbModConstSet` import is dropped from the
file (or trimmed from a multi-name import). Keep any seat that mirrors a Rails
`const_set` from the 18-site table in this RFC's README.

The assignment is type-checked against the namespace object's declared
property where the three-argument helper was not, so the sweep may surface a
seat onto the wrong owner or under a name the namespace does not declare. Fix
it — a wrong seat is the bug the helper was hiding, and widening the namespace
type to admit it is not the remedy.

Enumerate with
`grep -rn 'rbModConstSet(' --include=*.ts <paths>`.

## Acceptance criteria

- [ ] Every seat in scope is a plain assignment; the only `rbModConstSet`
      calls left in scope mirror a Rails `const_set` site, each citing it.
- [ ] No `rbModConstSet` import remains in a file with no such call.
- [ ] `pnpm typecheck` passes with no namespace-object type widened to admit
      a seat.
- [ ] `rbModName` answers the same qualified path for every class in scope as
      it did before the sweep (spot-check the classes named in any `inspect`,
      error-message or STI assertion in the package's tests).
- [ ] The package's built `dist` modules still load as ESM entry modules.
- [ ] The touched test files pass; no full-suite run (CLAUDE.md "Working in
      this repo").
