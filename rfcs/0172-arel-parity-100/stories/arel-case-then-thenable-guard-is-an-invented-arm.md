---
title: "arel: Case#then carries a thenable guard Rails does not have"
status: in-progress
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: arms
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8398
claim: "2026-10-02T13:42:01Z"
assignee: "arel-case-then-thenable-guard-is-an-invented-arm"
blocked-by: null
closed-reason: null
---

## Context

Left over from `arel-converge-invented-control-flow-arms`: `pnpm parity:api:arms:report --package=arel` still lists `nodes/case.ts#then` at `+if`.

Rails (`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/case.rb:20-23`):

```ruby
def then(expression)
  @conditions.last.right = Nodes.build_quoted(expression)
  self
end
```

`packages/arel/src/nodes/case.ts#then` opens with a guard Rails does not have: when called as `then(onFulfilled, onRejected)` with two functions it rejects with `TypeError("Arel::Nodes::Case is not awaitable; use #toSql() to render")` and returns. It exists because a JS object with a `then` method is a thenable: `await node`, `Promise.resolve(node)` or returning a `Case` from an `async` function calls `then(resolve, reject)`, which the Rails body would store as the last `When`'s right side and never settle. `packages/arel/src/nodes/case.trails.test.ts` ("Promise.resolve rejects rather than hanging (thenable hazard)") pins it.

The `expression === undefined ? null : expression` arms in `then` and `else` were removed by that story; only the thenable guard remains.

## Acceptance criteria

- [ ] Decide the shape: either the guard converges away (a `Case` cannot be mistaken for a thenable some other way) or `pnpm tasks block` this with the specific JS-thenable blocker. Do not close it by rewording the guard.
- [ ] If it converges, `Case#then` is the two Rails statements and `pnpm parity:api:arms:report --package=arel` no longer lists it.
