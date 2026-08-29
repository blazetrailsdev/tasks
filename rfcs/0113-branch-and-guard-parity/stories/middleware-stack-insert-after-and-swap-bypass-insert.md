---
title: "MiddlewareStack#insert_after and #swap splice directly instead of delegating to insert"
status: draft
updated: 2026-08-29
rfc: "0113-branch-and-guard-parity"
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

Rails' `MiddlewareStack#insert_after` and `#swap` both DELEGATE to `insert`
(`vendor/rails/actionpack/lib/action_dispatch/middleware/stack.rb:105-124`):

```ruby
def insert(index, klass, *args, &block)
  index = assert_index(index, :before)
  middlewares.insert(index, build_middleware(klass, args, block))
end
alias_method :insert_before, :insert

def insert_after(index, *args, &block)
  index = assert_index(index, :after)
  insert(index + 1, *args, &block)
end

def swap(target, *args, &block)
  index = assert_index(target, :before)
  insert(index, *args, &block)
  middlewares.delete_at(index + 1)
end
```

The trails port
(`packages/actionpack/src/action-dispatch/middleware/stack.ts:77-106`) splices
`this.entries` directly in all three, so neither `insert_after` nor `swap` calls
`insert`. Consequences:

- `assert_index` is not a shared helper: each method re-implements index
  resolution and raises its own message (`"No such middleware to insert after"`,
  `"No such middleware to swap"`) where Rails raises one message from
  `assert_index` (`stack.rb:186-190`).
- `build_middleware` — Rails' single construction point for a stack entry — is
  bypassed, so any future construction concern has three sites to change.
- `swap` does not use Rails' insert-then-`delete_at(index + 1)` shape, so the
  two bodies cannot be read side by side.

PR #7211 (RFC 0128) converged the SIGNATURES to Rails'
`(index|target, *args)` but left the bodies, since a body rewrite is outside a
parameter-name story.

Note the neighbouring `move` / `move_before` / `move_after` are a SEPARATE and
more serious finding — their two arguments are role-reversed against Rails —
tracked by `middleware-stack-move-reverses-rails-target-and-source`. Converge
that one first or together; they touch the same file.

## Acceptance criteria

- `insertAfter` and `swap` call `insert`, with Rails' `index + 1` and
  insert-then-`deleteAt(index + 1)` shapes respectively
  (stack.rb:113-124), and `insertBefore` remains the alias of `insert`.
- Index resolution goes through one `assertIndex` helper carrying Rails' name
  and message (stack.rb:186-190), replacing the three per-method throws.
- Entry construction goes through one `buildMiddleware` (stack.rb:107).
- `pnpm parity:api:calls` loses the corresponding rows rather than gaining any;
  test names in
  `packages/actionpack/src/action-dispatch/dispatch/middleware-stack.test.ts`
  are unchanged.
