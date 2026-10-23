---
title: "Sweep actionpack's 98 namespace seats to plain assignments"
status: draft
updated: 2026-10-22
rfc: "0000-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - derive-class-path-from-registered-namespaces
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

actionpack holds 98 seats onto `AbstractController`, `ActionController`
(57 of them), `ActionDispatch`, `ActionDispatch::Http`,
`ActionDispatch::Routing` and `ActionDispatch::Session`
(`packages/actionpack/src/namespaces.ts`).

One seat keeps the helper: `HelperMethods`
(`actionpack/lib/abstract_controller/helpers.rb:232`,
`klass.const_set(:HelperMethods, mod)`), read back by
`rbModConstGet(klass, "HelperMethods")` in
`abstract-controller/helpers.ts`.

Several open 0141 stories touch the same error-class seats
(`seat-remaining-qualified-error-classes`,
`exception-constructors-drop-hand-set-name`,
`action-dispatch-testing-autoload-block-seats-only-assertions`). Read them
first: each is now satisfied by the derivation rather than by a new seat, and
the retire story re-points them.

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
