---
title: "Route _enum method generation through _enumMethodsModule().defineEnumMethods"
status: ready
updated: 2026-07-06
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

When `defineEnum` was folded into `_enum` (PR #3395,
`remove-define-enum-route-all-through-base-enum`), `_enum`
(`packages/activerecord/src/enum.ts`) ended up **inlining** the per-value
method generation (predicate / bang / scope / not-scope / friendly + special-char
variants). Rails instead routes this through
`_enum_methods_module.module_eval { define_enum_methods(...) }`
(`vendor/rails/activerecord/lib/active_record/enum.rb:252-278`, with
`define_enum_methods` at `enum.rb:302-322`).

As a result we now carry **two** generators: the live inlined loop in `_enum`,
and the dormant-but-`api:compare`-matched `EnumMethods.defineEnumMethods` /
`_enumMethodsModule` (`enum.ts` ~210-265, ~500-520). The dormant one mirrors
Rails' structure (and keeps `enum.rb` at 19/19 in `api:compare`) but is never
called by the production path.

## Acceptance criteria

- `_enum` generates predicate/bang/scope/not-scope by calling
  `this._enumMethodsModule().defineEnumMethods(name, valueMethodName, value,
scopes, instanceMethods)` for both the value method name and the friendly
  alias, mirroring Rails' loop.
- `EnumMethods.defineEnumMethods` produces the trails camelCase surface
  (`is{Name}`, `{name}Bang`, scope, `not{Name}`) — i.e. it becomes the single
  generator, not a dead parallel one.
- Special-char original-form (`"isAmerican Bobtail"`, `"American BobtailBang"`)
  handling stays correct.
- `api:compare` stays 19/19 for `enum.rb`; `enum.test.ts` (204) +
  `virtualized-patterns.test-d.ts` stay green; test names unchanged.
