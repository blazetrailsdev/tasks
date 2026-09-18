---
title: "Port Ruby Method#arity into ruby-compat and use it in Locator.locate"
status: draft
updated: 2026-09-16
rfc: "0155-assertion-surfaced-port-bugs"
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

trails#7835 ported `GlobalID::Locator.locate`'s arity branch
(`vendor/globalid/lib/global_id/locator.rb:30-35`,
`locator.method(:locate).arity == 1`). Because JS `Function.length` reports 1
for both `(gid)` and `(gid, options = {})`, it added an unexported
`methodArity(fn)` in `packages/globalid/src/locator.ts` that parses
`Function.prototype.toString()` and returns Ruby arity semantics
(`-(required + 1)` once an optional or rest parameter is present).

That helper is invented surface in globalid: Rails reads Ruby core
`Method#arity`, it has no Rails name, and it is not reusable by other
ports that branch on arity. It also carries no receipt (unexported, so outside
the measured surface) — the justification lives only in the PR body.

## Converged shape

Port Ruby core `Method#arity` / `Proc#arity` (`vendor/ruby/proc.c`
`method_arity` / `rb_proc_arity`) into `@blazetrails/ruby-compat` as the one
source-parsing arity reader, with a `@noRailsEquivalent` / receipt citing the
language gap if needed, and have `Locator.locate` call it as
`arity(locator.locate) === 1`, deleting the local `methodArity`.

## Acceptance criteria

- `methodArity` is gone from `packages/globalid/src/locator.ts`; `Locator.locate`
  uses the ruby-compat arity port.
- ruby-compat tests cover `(a)` → 1, `(a, b = {})` → -2, `(...a)` → -1,
  `() => x` → 0, `a => x` → 1, method shorthand and `async` forms.
- `global_locator_test.rb › use locator with class and single argument` stays at
  0 assertion mismatches; no extra-surface gate regression.
