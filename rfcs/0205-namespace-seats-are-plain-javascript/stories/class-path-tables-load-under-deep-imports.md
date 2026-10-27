---
title: "Load each package's class-path table under deep imports before the seat sweeps remove seats"
status: draft
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9365 seats each package's `src/class-paths.generated.ts` from the package
entry: the entry imports it last, so every class it names is already evaluated.
A test or caller that deep-imports a single module never loads the table. There,
`rbModName` (`packages/ruby-compat/src/object.ts`) falls back to `klass.name` for
every class with no `const_set` or seat path. Ruby's `rb_mod_name`
(`vendor/ruby/v3.3.11/variable.c:122`) answers the full path however the class
was reached.

Today this is masked, because the 790 seats still write `classpaths`. Each RFC
0205 `sweep-*` story removes seats, so a deep-imported class in the swept package
loses its path. The vitest projects mostly deep-import (`packages/*/src/**`).

## Acceptance criteria

- [ ] Every vitest project that runs package tests loads each package's table
      (for example, by importing the package entry in a setup file, or by a
      side-effect import that does not change module evaluation order), so a
      swept class answers its Rails path in a deep-import test.
- [ ] A test proves it: in a package with a table, a deep-imported, unseated class
      answers its `rails-api.json` fqn from `rbModName`.
- [ ] The sweep stories list this as a dependency (`tasks set-deps`).
