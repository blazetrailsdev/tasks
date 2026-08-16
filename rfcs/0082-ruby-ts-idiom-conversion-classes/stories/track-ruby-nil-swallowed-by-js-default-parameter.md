---
title: "Ruby nil spelled as undefined is swallowed by JS default parameters"
status: draft
updated: 2026-08-16
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A Ruby method with an optional parameter distinguishes "argument omitted" from
"argument passed as nil"; a TypeScript default parameter does not, because it
substitutes its default for an explicitly-passed `undefined`. So a value the
port spells as `undefined`-for-Ruby-nil is SILENTLY REPLACED by the callee's
default at every such call site.

Live instance found in PR #6600. Arel's `distinct` mirrors Ruby's
`def distinct(value = true)`:

```ts
// packages/arel/src/select-manager.ts
distinct(value: unknown = true): this
```

Rails calls it with the (possibly nil) value method
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb`,
`build_arel`):

```ruby
arel.distinct(distinct_value)
```

While `distinct_value` defaulted to `undefined`, `arel.distinct(undefined)`
took the `= true` default and emitted `SELECT DISTINCT` on EVERY relation —
~55 test failures across the relation/association suites, none of them near the
call site. Passing `null` (also Ruby nil, but not a default-parameter trigger)
fixed it. #6600 settled the whole `SINGLE_VALUE_METHODS` family on `null` for
exactly this reason.

The class is general and unswept: anywhere trails spells Ruby nil as
`undefined` and hands it to a function whose parameter carries a TS default,
the default silently wins. It is invisible to typecheck (`undefined` is
assignable to an optional parameter) and to the call-set/call-arg parity gates
(the call is made, with one argument, at the right name).

CLAUDE.md already names the trap under "Ruby idioms that do not translate
literally" → kwargs; this story is the sweep, alongside
`track-ruby-truthiness-residuals`.

## Converged shape

Ruby nil handed to a Ruby-optional parameter must be spelled `null`, never
`undefined`:

```ts
arel.distinct(this.distinctValue); // distinctValue reads back `null` when unset
```

Not `?? null` at the call site — the nil-producing READER should yield `null`,
so every call site is correct by construction (the shape #6600 adopted for the
generated `*_value` accessors in `defineValueMethods`).

## Acceptance criteria

- Enumerate TS functions that carry a default parameter AND mirror a Ruby
  method whose parameter has a Ruby default (start with `packages/arel` and the
  `relation/` builders — `distinct`, `take`, `skip`, `lock` are the likely set).
- For each, confirm every caller that can pass a Ruby nil passes `null`, not
  `undefined`; fix by making the source reader yield `null` rather than
  patching call sites.
- Where a value legitimately means "omitted", keep it `undefined` and say so at
  the call site — the two must not be used interchangeably in one signature.
- Consider a lint rule under `eslint/` (see RFC 0025) that flags a
  Ruby-nil-typed value flowing into a defaulted parameter; a regression here is
  invisible to typecheck and to both call-parity gates, which is what let the
  `distinct` instance ship.
- No behavior change beyond the defects fixed; deltas non-negative.
