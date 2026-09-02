---
title: "type-lookup-forwards-a-variadic-positional-list"
status: claimed
updated: 2026-09-02
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 9
pr: null
claim: "2026-09-02T00:37:12Z"
assignee: "actionview-partial-renderer-bodies-pass-rails-arguments"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Type.lookup` is `def lookup(*args, adapter: current_adapter_name,
**kwargs)` (`vendor/rails/activerecord/lib/active_record/type.rb:41`), and it
forwards the whole positional list: `registry.lookup(*args, adapter: adapter,
**kwargs)`. `activerecord/test/cases/type_test.rb:19` exercises that with a
SECOND positional — `ActiveRecord::Type.lookup(:foo, :arg)` — which reaches the
registered type class's own constructor.

The port takes one positional:

- `packages/activerecord/src/type.ts:110` — `lookup(args, kwargs?)`
- `packages/activerecord/src/type/adapter-specific-registry.ts:168` —
  `lookup(symbol, options?)`, likewise not variadic, and the `Registration`
  call path below it drops any extra positional too.

So a second positional cannot be passed at all. This predates
`param-drift-activerecord-final-four-residual-rows` (PR #7278), which only
converged the parameter NAME onto Rails' `args`; the arity gap was surfaced in
that PR's review and filed here rather than widened in scope.

## Acceptance criteria

- `Type.lookup` and `AdapterSpecificRegistry#lookup` forward a variadic
  positional list the way `type.rb:41` and
  `type/adapter_specific_registry.rb` do, down to the registration's own
  `Registration#call`.
- The `type_test.rb` case that passes a second positional is ported under its
  Rails test name.
- `pnpm parity:api --package activerecord --params` stays at 0 rows and arity
  does not regress; `parity:api:calls` / `parity:api:calls:args` no new row.
