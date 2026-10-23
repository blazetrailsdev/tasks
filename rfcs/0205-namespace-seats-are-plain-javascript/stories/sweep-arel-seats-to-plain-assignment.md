---
title: "Sweep arel's 144 namespace seats to plain assignments"
status: ready
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
deps-rfc: []
est-loc: 480
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

arel holds 144 seats onto the `Arel` / `Arel::Attributes` /
`Arel::Collectors` / `Arel::Nodes` / `Arel::Visitors` namespace objects
(`packages/arel/src/namespaces.ts`), 114 of them onto `Nodes`. It is the
package the helper spelling was settled on (trails PR 8370), so it is the
reference sweep and the one that proves the derivation: its recorded paths and
its derived paths must agree exactly.

`Nodes`, `Collectors` and `Visitors` are typed `typeof <barrel>Module`
and are the public `Arel.Nodes` / `Arel.Collectors` / `Arel.Visitors`
exports, so each assignment checks against a declared property.

The generated node classes in `nodes/binary.ts`, `nodes/unary.ts` and
`nodes/function.ts` keep the helper: Rails builds them with
`const_set name, Class.new(Binary)` (`activerecord/lib/arel/nodes/binary.rb:122`,
`unary.rb:41`, `function.rb:42`), a computed name with no declaration to
assign at.

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
