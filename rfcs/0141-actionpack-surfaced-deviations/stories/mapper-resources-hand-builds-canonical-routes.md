---
title: "mapper-resources-hand-builds-canonical-routes"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mapper#resources` / `#resource`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`) build the seven
canonical routes by hand — `new Route("GET", basePath, controller, "index", …)`
and so on, reading `@scope[:path]` / `@scope[:as]` / `@scope[:module]` — and
wrap only the caller's block in `with_scope_level` + `resource_scope`.

Rails wraps the whole body (`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb`
`resources`, ~`:1518-1543`; `resource`, ~`:1348-1375`):

```ruby
with_scope_level(:resources) do
  options = apply_action_options :resources, options
  resource_scope(Resource.new(resources.pop, api_only?, @scope[:shallow], options)) do
    yield if block_given?
    concerns(options[:concerns]) if options[:concerns]
    collection do
      get  :index if parent_resource.actions.include?(:index)
      post :create if parent_resource.actions.include?(:create)
    end
    new do
      get :new
    end if parent_resource.actions.include?(:new)
    set_member_mappings_for_resource
  end
end
```

so the routes come out of `collection {}` / `new {}` /
`set_member_mappings_for_resource` (`mapper.rb:1939-1949`) through
`map_method` → `decomposed_match` → `add_route`, with names from
`name_for_action` and the block's routes drawn FIRST. trails emits
index/create/new before the block and member routes after it, and has no
`Resource` / `SingletonResource` class (the `ResourceLike` literal stands in).
`setMemberMappingsForResource` also keeps an early return on a missing parent
resource where Rails raises through `member`.

Surfaced by the review of trails#8142 (`mapper-keeps-two-parallel-scope-chains`),
which converged the scope chain but left this structure as it was on `main`.

## Acceptance criteria

- `resources` / `resource` run their whole body inside `with_scope_level` +
  `resource_scope`, in Rails' order: block, concerns, `collection`, `new`,
  `set_member_mappings_for_resource`.
- The canonical routes are drawn through `collection` / `new` / `member` and
  the route-drawing DSL rather than hand-built `Route` objects.
- `ResourceLike` is replaced by ports of `Mapper::Resources::Resource` and
  `SingletonResource`.
- `setMemberMappingsForResource` has no early return; `member` raises outside a
  resource scope as in Rails.
