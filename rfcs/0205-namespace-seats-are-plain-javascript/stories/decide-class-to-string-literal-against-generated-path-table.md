---
title: "decide-class-to-string-literal-against-generated-path-table"
status: ready
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/class-to-string-seat` writes a `static toString()` string literal
per class from a manifest, so each class carries a hand-seeded copy of its Ruby
path. activejob and activesupport are enrolled; the fifteen
`class-to-string-seat-enroll-<package>` stories would enroll the rest.

RFC 0205's `derive-class-path-from-registered-namespaces` landed a generated
per-package table (`packages/<pkg>/src/class-paths.generated.ts`, written by
`pnpm parity:class-paths` from `rails-api.json`) that `rbModName` reads after
`classpaths` and before `klass.name`. `rbModToS`
(`packages/ruby-compat/src/object.ts`) still reads an own `toString` ahead of
`rbModName`, so for an enrolled class the literal and the table now answer the
same path twice.

## Acceptance criteria

- [ ] The repo owner decides whether `rbModToS` reading the generated table
      makes the `static toString()` literal unnecessary.
- [ ] If it does: the enrollment stories close `FALSIFIED:`, and a story is
      filed to retire the rule and the two enrolled packages' literals (the
      enrollment set is only-grow, so that retirement is its own reviewed step).
- [ ] If it does not: the enrollment stories are unblocked with the reason the
      literal is still needed recorded here.
