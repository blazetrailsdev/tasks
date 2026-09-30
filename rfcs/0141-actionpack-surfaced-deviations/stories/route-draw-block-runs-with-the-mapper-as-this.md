---
title: "route-draw-block-runs-with-the-mapper-as-this"
status: done
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: ["routes-file-draws-itself-not-into-every-route-set"]
deps-rfc: []
est-loc: null
priority: null
pr: trails#8304
claim: "2026-09-30T20:58:00Z"
assignee: "route-draw-block-runs-with-the-mapper-as-this"
blocked-by: null
closed-reason: null
---

## Context

In Rails you never name the mapper. `config/routes.rb` is

```ruby
Rails.application.routes.draw do
  resources :posts
end
```

and `RouteSet#eval_block`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb:474-481`)
runs the block with the mapper as `self`:

```ruby
def eval_block(block)
  mapper = Mapper.new(self)
  if default_scope
    mapper.with_default_scope(default_scope, &block)
  else
    mapper.instance_exec(&block)
  end
end
```

The generators write receiver-less DSL, and `Rails::Generators::Actions#route`
(`railties/lib/rails/generators/actions.rb:409-416`) logs `route  resources :posts`.

trails diverges in three places:

- `RouteSet#evalBlock` (`packages/actionpack/src/action-dispatch/routing/route-set.ts:951-954`)
  is `block(mapper)`. The mapper is an argument, not the receiver, and the
  `default_scope` / `with_default_scope` arm is dropped.
- The generated `config/routes.ts` exports `drawRoutes(mapper: Mapper)`, so every
  route is spelled `mapper.resources(...)`.
- The generators hard-code that receiver:
  - `resource-route-generator.ts:11`
  - `controller-generator.ts:90`
  - `authentication-generator.ts:98-99`
  - `trails-actions.ts:94` (the `namespace` wrap)

  So `generate scaffold` prints `route  mapper.resources("posts");`.

## Converged shape

`instance_exec` ports as a `this`-typed `function`, the settled trails idiom
(scope bodies already require a `function` for the same reason):

```ts
Trails.application.routes().draw(function () {
  this.resources("posts");
  this.get("up", { to: "rails/health#show", as: "rails_health_check" });
});
```

- `DrawCallback` becomes `(this: Mapper) => void`. `evalBlock` runs
  `block.call(mapper)`, and ports the `withDefaultScope` arm.
- Nested DSL blocks (`namespace`, `scope`, `resources ... do`) take `this`-typed
  functions the same way. Rails `instance_exec`s those too.
- The generators emit receiver-less-in-spirit DSL, `this.resources("posts");`,
  and `route` logs it.
- TS can't resolve a bare `resources(...)` against a receiver, so `this.`
  stands in for Ruby's implicit `self`. That is the only spelling difference.

This builds on `routes-file-draws-itself-not-into-every-route-set`, which makes
the routes file call `draw` itself. Its acceptance criteria spell the block
`(mapper) => ...`; this story supersedes that spelling.

## Acceptance criteria

- [ ] `RouteSet#evalBlock` calls the block with the `Mapper` as `this`, and ports
      the `with_default_scope` arm, per `route_set.rb:474-481`.
- [ ] The `trails new` routes file and every generator that writes routes emit
      `this.<dsl>(...)`. No generated file names `mapper`.
- [ ] `generate scaffold Post` logs `route  this.resources("posts");`.
- [ ] Engine and app routes files, the fixtures and the docs are updated to match.
