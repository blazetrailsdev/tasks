---
title: "no-standalone-associations misses macro calls on aliased class consts"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/no-standalone-associations` resolves the association target from
the identifier passed as the first argument to
`Associations.<macro>.call(Target, …)`. When that identifier is a local alias
(`const Person = IndexErrorsPerson;`) rather than the class binding itself,
the rule does not connect the call to a class declaration and stays silent.

Observed in PR #5275: `packages/activerecord/src/autosave-association.test.ts`
carried six standalone `Associations.hasMany/hasOne/belongsTo.call(...)` sites
that the rule reported only _after_ the alias consts introduced during the
canonical-shadow rename were removed. The aliases were incidental — any test
that writes `const Model = SomeClass;` before a standalone macro call gets the
same free pass, so the burndown's "lint is clean" signal is weaker than it
looks.

## Acceptance criteria

- The rule resolves a first-argument identifier through simple
  `const <alias> = <ClassIdentifier>;` bindings in the same scope chain and
  reports the underlying class.
- A unit test in `eslint/` covers the aliased case (both the reported message
  naming the real class and the un-aliased case still passing).
- Re-run the rule across `packages/activerecord/src/**/*.test.ts` and record
  the newly surfaced site count; if it is non-trivial, register the conversions
  as a separate story rather than fixing them here.
