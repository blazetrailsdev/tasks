---
title: "Sweep activerecord's adapter, association, encryption and CPK namespace seats"
status: ready
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The second half of activerecord: the `ConnectionAdapters.X`,
`Associations.X`, `Encryption.X`, `Sharded.X` and `Cpk.X` seats, plus
the per-adapter files under `packages/activerecord/src/connection-adapters/`.
`Cpk` alone carries 29.

Two seats keep the helper: the HABTM join model
(`associations.rb:1877`, `const_set join_model.name, join_model`) and the
association extension module
(`associations/builder/collection_association.rb:26`). Both bind a computed
name, and the HABTM one is also touched by the
`habtm-macro-body-lives-in-the-builder` story — coordinate rather than
racing it.

An adapter's seats are read by `ConnectionAdapters.resolve`'s
`rbModConstGet(Object, className)` path
(`packages/activerecord/src/connection-adapters.ts`), which reads the
top-level table `registerConstant` fills and is unaffected; do not convert
that read.

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
