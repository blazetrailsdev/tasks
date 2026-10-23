---
title: "Sweep activerecord's core and relation namespace seats to plain assignments"
status: draft
updated: 2026-10-22
rfc: "0000-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
deps-rfc: []
est-loc: 520
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

activerecord holds 242 seats, the largest population, so it splits in two.
This story takes the `ActiveRecord.X`, `Scoping.X`, `Locking.X`,
`AttributeMethods.X`, `TypeCaster.X`, `Tasks.X` and `Railties.X` seats
and everything under `packages/activerecord/src/relation/`.

Four seats keep the helper, each mirroring a Rails `const_set`:
`GeneratedAttributeMethods` (`attribute_methods.rb:43`),
`GeneratedAssociationMethods` (`core.rb:340`), and the mangled delegate and
`GeneratedRelationMethods` in delegation (`relation/delegation.rb:40,65`).
Check each against RFC 0058's generated-module work before rewriting it.

24 of the package's seats are in `*.test.ts` files, seating canonical and
ad-hoc models; those belong to the ruby-compat and test-file sweep story, not
here.

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
