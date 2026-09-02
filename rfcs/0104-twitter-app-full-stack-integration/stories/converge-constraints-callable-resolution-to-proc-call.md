---
title: "Constraints#matches mistakes Function.prototype.call for a Ruby callable"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
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

`Mapper::Constraints` landed in #7390
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`), ported from
`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:29-81`. Two of
its bodies resolve a constraint's `call` as a plain property read, which is
wrong for the case Ruby's `respond_to?(:call)` most often means — a lambda.

`Constraints#matches?` (`mapper.rb:52-57`):

```ruby
@constraints.all? do |constraint|
  (constraint.respond_to?(:matches?) && constraint.matches?(req)) ||
    (constraint.respond_to?(:call) && constraint.call(*constraint_args(constraint, req)))
end
```

and `#constraint_args` (`mapper.rb:66-80`):

```ruby
arity = constraint.respond_to?(:arity) ? constraint.arity : constraint.method(:call).arity
```

The merged TS reads `c.call` off the constraint. When the constraint is a JS
function — the analogue of the Ruby lambda a `constraints:` option passes —
`c.call` resolves to the INHERITED `Function.prototype.call`, not to the
constraint. So:

- `matches` invokes `Function.prototype.call(request)`, which sets `this` and
  calls nothing, instead of invoking the constraint;
- `constraintArgs` reads `Function.prototype.call.length` (always 1), so a
  two-arity constraint is handed `[request]` where Rails hands it
  `[request.path_parameters, request]`.

`Constraints::CALL` (`mapper.rb:33`) already tells the two apart with an inline
ternary, so the file carries the knowledge in one place and not the other two.

The bug is latent today: `RouteSet#_app`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts`) is the only
constructor call site and always passes `[]` for `blocks`, because route-level
`constraints do ... end` blocks are not carried on `Route` — see
`port-mapping-app-static-dispatcher-and-serve-constraints-arms`. It becomes
live the moment that story lands.

## Converged shape

One resolution used by all three sites — `CALL`, `matches`, `constraintArgs`:
if the target is a JS function it IS the callable (Ruby `Proc#call`), otherwise
its `call` method is. Invoke through `.call(target, ...)` / `.apply(target, ...)`
so `this` is the constraint either way. That helper is the JS half of
`respond_to?(:call)` and has no Ruby counterpart, so it carries a
`@noRailsEquivalent PERMANENT` receipt.

A working patch (fix plus a `Mapper::Constraints` describe covering the CALL /
SERVE strategies, `dispatcher?`, the cascade, the arity ladder and the
`app.is_a?(self.class)` unwrap) was written against #7390 but missed the merge;
it is reproduced below.

## Acceptance criteria

- A JS-function constraint is invoked by `Constraints#matches`, with `this`
  bound to the constraint.
- `constraintArgs` reads the constraint's own arity, so a two-arity constraint
  receives `[request.pathParameters, request]` per `mapper.rb:78`.
- `Constraints::CALL` shares that one resolution rather than repeating a ternary.
- Tests cover the arity ladder (0 / 1 / 2), both `CALL` shapes (function and
  `call`-method object), `SERVE`, `dispatcher?`, the `X-Cascade: pass` cascade
  when a constraint does not match, and the `Constraints`-unwrapping branch of
  `initialize` (`mapper.rb:40-43`).
