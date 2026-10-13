---
title: "ruby-compat: the inline class-vs-function tests read one shared predicate"
status: draft
updated: 2026-10-13
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8854 added `rbObjIsProc` (`packages/ruby-compat/src/object.ts`,
`rb_obj_is_proc`, `vendor/ruby/v3.3.11/proc.c:120`) as the test for "a function
that is not a class", and `rbEqq` (`packages/ruby-compat/src/rb-equal.ts`) now
uses it.

The same class-versus-function test is still written inline as
`Object.getOwnPropertyDescriptor(x, "prototype")?.writable === false` in
ruby-compat: `object.ts` (`rbObjClass`, `basicObjRespondTo`'s `klass`, and the
two `rbModToS` arms of `rbInspect` / `rbObjAsString`), `include.ts`
(`isClassConstructor` and one more site near the top of the file) and
`variable.ts`.

## Acceptance criteria

- [ ] Each inline `prototype`-descriptor class test in
      `packages/ruby-compat/src` reads one shared predicate (`rbObjIsProc`, or
      its class-side twin beside it), with no behaviour change.
- [ ] `grep -rn 'writable === false' packages/ruby-compat/src` shows only that
      predicate's definition and unrelated uses (the `name` descriptor check in
      `include.ts`).
