---
title: "middleware-stack-move-reverses-rails-target-and-source"
status: in-progress
updated: 2026-08-31
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: 7278
claim: "2026-08-31T00:08:11Z"
assignee: "param-drift-activerecord-final-four-residual-rows"
blocked-by: null
closed-reason: null
---

## Context

`MiddlewareStack#move`, `#move_before` and `#move_after` take
`(target, source)` in Rails and move **source** to **target**'s position
(`vendor/rails/actionpack/lib/action_dispatch/middleware/stack.rb:143-159`):

```ruby
def move(target, source)
  source_index = assert_index(source, :before)
  source_middleware = middlewares.delete_at(source_index)
  target_index = assert_index(target, :before)
  middlewares.insert(target_index, source_middleware)
end
alias_method :move_before, :move
```

The trails port
(`packages/actionpack/src/action-dispatch/middleware/stack.ts:121-146`) has the
two roles **the other way round**: it removes the FIRST argument's entry and
re-inserts it at the SECOND argument's position. So Rails'
`@stack.move(0, BarMiddleware)`
(`vendor/rails/actionpack/test/dispatch/middleware_stack_test.rb:115`) is spelled
`stack.move(BazMiddleware, 0)` in trails
(`packages/actionpack/src/action-dispatch/dispatch/middleware-stack.test.ts:149`),
and `move_before(FooMiddleware, BarMiddleware)` (moves Bar before Foo,
`middleware_stack_test.rb:134`) is spelled `moveBefore(BazMiddleware,
FooMiddleware)` (`middleware-stack.test.ts:171`).

Arity matches, so no gate saw it, and the trails tests carry Rails' test names
verbatim over reversed bodies — which is why the RFC 0128 rename pass
(`param-drift-actiondispatch`, PR #7211) deliberately did NOT rename these three
parameters to Rails' `target` / `source`: doing so would have made a reversed
body read as faithful. They stay spelled `index` / `beforeTarget` / `afterTarget`
and are three of the rows in actiondispatch's `param-name-mark.json` entry.

`insert_before` / `insert_after` / `swap` next door are NOT reversed; only the
three `move` variants are.

## Acceptance criteria

- `move`, `moveBefore` and `moveAfter` take `(target, source)` and move `source`
  to `target`'s position, matching stack.rb:143-159 line for line, including
  `move_before` being the alias of `move` and `move_after` inserting at
  `target_index + 1`.
- The six `move*` cases in
  `packages/actionpack/src/action-dispatch/dispatch/middleware-stack.test.ts`
  pass Rails' arguments in Rails' order and assert Rails' resulting stack. Test
  NAMES are unchanged — they already match
  `vendor/rails/actionpack/test/dispatch/middleware_stack_test.rb:114-166`
  verbatim; only the bodies move.
- Every caller of the three methods is updated.
- The three parameters then carry Rails' identifiers, and actiondispatch's mark
  in `scripts/api-compare/param-name-mark.json` is narrowed with
  `pnpm parity:api:params:tighten` (never rewritten upward).
- `parity:api:calls` and `parity:api:calls:args` show no new row.
