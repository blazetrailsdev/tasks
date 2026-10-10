---
title: "scope and constraints call their block unbound, so this is undefined inside one"
status: draft
updated: 2026-10-09
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 50
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap (trailmap#48) while drawing a nested route tree for the
first time.

`RouteSet#draw` binds its block to the mapper, so the generated
`config/routes.ts` can say `this.get(...)`. `Mapper#scope` does not:

```ts
// packages/actionpack/src/action-dispatch/routing/mapper.ts (scope)
const previous = this._scope;
this._scope = this._scope.new(scope);
try {
  cb(); // ← called unbound
} finally {
  this._scope = previous;
}
```

`Mapper#constraints` delegates to `scope`, so it inherits the same behaviour,
and so does every other block-taking mapper method that routes through it.

So this — the shape Rails users write, and the shape `draw` itself teaches by
binding — throws:

```ts
Trails.application!.routes().draw(function () {
  this.get("up", { to: "health#show" }); // fine, draw bound it

  this.constraints({ owner: OWNER }, function () {
    this.get(":owner", { to: "owners#show" }); // TypeError: Cannot read
  }); // properties of undefined
}); // (reading 'get')
```

```text
TypeError: Cannot read properties of undefined (reading 'get')
    at config/routes.ts:140:10
    at Mapper.scope (…/routing/mapper.js:822:13)
    at Mapper.constraints (…/routing/mapper.js:938:14)
```

In Ruby this question does not arise: `scope` yields through `instance_eval`,
so `self` inside the block is the mapper at every depth. Here the top level
binds and every nesting below it does not, which is the worst version — the
file works until the first nested block.

trailmap writes the nested blocks as ARROW functions, which take `this`
lexically from the enclosing `function ()` that `draw` bound, and says why at
the call site. That is a local spelling, not a shim: it does not reach into
the framework, and it stays correct once the block is bound.

An earlier version captured the mapper (`const map = this`) instead. The alias
was unnecessary — review of trailmap#48 pointed out that an arrow already has
the right `this` — and it is gone, but either spelling is a way of writing
around this defect rather than a reason not to fix it.

## Converged shape

Every mapper method that takes a block calls it with the mapper as `this`, as
`draw` does:

```ts
cb.call(this);
```

An arrow function passed by a caller is unaffected — it ignores `thisArg` —
so this is additive for code written either way.

## Acceptance criteria

- [ ] `scope`, `constraints`, `namespace`, `resource`, `resources`, `member`,
      `collection`, `concern` and `with_options`-alikes call their block bound
      to the mapper.
- [ ] A routing test draws a nested tree with `function () { this.get(...) }`
      at two levels and recognizes a path from the inner one; it fails on the
      current code with the TypeError above.
- [ ] The arrow-function form keeps working, with a case for it, so the fix
      cannot be read as a requirement to use `function`.
