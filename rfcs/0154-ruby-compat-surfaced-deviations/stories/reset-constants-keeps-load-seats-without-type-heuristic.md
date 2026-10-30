---
title: "resetConstants tells load seats from test seats without a type heuristic"
status: draft
updated: 2026-10-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`resetConstants` (`packages/ruby-compat/src/variable.ts`) is a test teardown. Since trails#9508 merged the constant table into `TopLevel`, it tells a gem seat from a test seat by value type: it deletes functions and `::` paths, and keeps other values. So `TopLevel.Trails`, a class (`packages/trailties/src/rails.ts:37`), is dropped by a reset, and a test's `registerConstant("Foo", {})` survives one. No caller loads trailties today.

## Acceptance criteria

- `resetConstants` removes what a test seated and keeps what a gem seated at load, whatever the value's type, with no type heuristic.
- A test covers a class gem seat and a plain-object test seat.
