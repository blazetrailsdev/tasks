---
title: "mapper-root-ships-only-one-of-two-arms"
status: blocked
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-26T02:32:09Z"
assignee: "mapper-root-ships-only-one-of-two-arms"
blocked-by: "Blocked on mapper-keeps-two-parallel-scope-chains. Rails' path_scope(parent_resource.path) (mapper.rb:1747) merges onto @scope[:path], which inside a resources block is the OUTER path. trails' pathScope pushes currentPrefix()+path onto scopeStack, whose top inside resources() is already basePath/:singular_id, so the arm cannot be ported without double-appending. Also: trails' resources() never enters withScopeLevel('resources'), so @scope.resources? is never true. The story premise that root-in-resources is behaviourally right is falsified: mapper.test.ts pins '/products/:product_id(.:format)' named product_root, where Rails' test_root_works_in_the_resources_scope (routing_test.rb:1953) gives /products and products_root_path."
closed-reason: null
---

## Context

`Mapper#root` has two arms
(`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:1736-1754`):

```ruby
if @scope.resources?
  with_scope_level(:root) do
    path_scope(parent_resource.path) do
      match_root_route(options)
    end
  end
else
  match_root_route(options)
end
```

As of #7630 trails' `root`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`) delegates to
`matchRootRoute`, converging the else arm, but ships only that arm — the
`@scope.resources?` branch is absent.

It cannot be ported as written today. Rails reads the resource's own path
segment off `Resource#path` (`attr_reader :controller, :path, :param`,
`mapper.rb:1175`), and trails' `ResourceLike`
(`mapper.ts:24-32`) has no `path` field: the objects `resources`/`resource`
push carry only `memberName` / `collectionName` / `nestedParam` / `param` /
`resourceScope` / `actions`. trails instead keeps the resource path segment on
the scope-stack frame, so `currentPrefix()` already includes it and a literal
`pathScope(parentResource.path)` would double-append. That is the two-parallel-
scope-chains divergence tracked by `mapper-keeps-two-parallel-scope-chains`.

`root` inside a `resources` block still produces the right path today, by way
of the scope stack rather than by way of Rails' branch — so this is a structural
gap, not a behavioural one.

## Acceptance criteria

- [ ] `ResourceLike` carries `path`, populated at both resource-construction
      sites, mirroring `Resource#path` (`mapper.rb:1175`).
- [ ] `Mapper#root` ships both arms of `mapper.rb:1745-1753`, with
      `withScopeLevel("root")` + `pathScope(parentResource.path)` around
      `matchRootRoute` in the `resources?` arm.
- [ ] A test pins `root` declared inside a `resources` block, matching the path
      Rails produces.
- [ ] `pnpm parity:test --package actiondispatch` non-regressing.
