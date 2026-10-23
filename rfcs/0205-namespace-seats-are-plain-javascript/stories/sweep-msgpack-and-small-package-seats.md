---
title: "Sweep msgpack, nokogiri, rack, bcrypt, marcel, globalid and trailties seats"
status: ready
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The tail: msgpack 19 (`MessagePack`), trailties 14 (7 in tests), nokogiri
6 (`Nokogiri::XML`), bcrypt 8, rack 5, marcel 2, globalid 1. One PR.

trailties' Thor seats are owned by
`thor-parser-classes-seat-their-ruby-names-on-the-thor-class` and
`thor-command-and-core-ext-seats-pass-an-object-literal`, both of which
predate the settled spelling and are written against
`rbSetClassPathString`. Read them first; this sweep supersedes their seat
spelling, and the retire story re-points them.

bcrypt's `BCrypt::Errors` is a named module seating its error classes
(trails#8454) and is read by error-message assertions — check those paths
derive identically.

No seat in these packages mirrors a Rails `const_set` except
`Object::APP_PATH` in trailties
(`railties/lib/rails/app_loader.rb:57`), if that path is ported.

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
