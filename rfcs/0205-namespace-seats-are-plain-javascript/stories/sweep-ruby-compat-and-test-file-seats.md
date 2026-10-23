---
title: "Sweep the remaining test-file seats and ruby-compat's own"
status: draft
updated: 2026-10-22
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

111 seats sit in `*.test.ts` files across activerecord (24), activejob
(18), actionview (11), actioncable (7), activemodel (7), trailties (7) and
ruby-compat (30), plus 8 non-test ruby-compat seats. They seat test models and
ad-hoc classes, most onto a test-case object or `Object`
(`rbModConstSet(Object, "ViewLoadPathsTest", ViewLoadPathsTest)`,
`rbModConstSet(InheritanceAttributeTest, "Company", this)`).

A test seat exists so a model's qualified name renders in an assertion, which
is exactly what the derivation answers — but a test-case object is not a
registered namespace, so decide per file whether to register the test case as
a namespace or assert the unqualified name Rails' own test would print. Read
the Rails test before changing an assertion; CLAUDE.md forbids renaming or
reworking a test name.

ruby-compat's own 30 test seats exercise `rbModConstSet` itself and mostly
stay: they are the helper's unit tests, and the helper survives for the Rails
`const_set` sites. Keep the coverage, drop only what tested the seat protocol
this RFC removes, and move the path assertions onto the derivation.

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
