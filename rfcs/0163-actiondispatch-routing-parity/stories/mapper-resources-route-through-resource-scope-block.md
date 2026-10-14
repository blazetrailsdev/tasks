---
title: "mapper-resources-route-through-resource-scope-block"
status: done
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8900
claim: "2026-10-14T14:33:43Z"
assignee: "mapper-resources-route-through-resource-scope-block"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/routing/mapper.ts` `resources()` /
`resource()` build `Resource` / `SingletonResource` (trails#8891) but still add
their routes inline via `addRouteToSet` with a hand-built `names` map, and
`edit`/`show`/`update`/`destroy` paths hand-joined from `shallowPath`.
Rails (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1345-1420`,
`resources` at `:1517+`) instead does
`resource_scope(Resource.new(...)) { yield; concerns; collection { get :index; post :create }; new { get :new }; set_member_mappings_for_resource }`.

## Acceptance criteria

- [ ] `resources` / `resource` bodies mirror Rails' `resource_scope` block, reaching routes through `collection` / `new` / `set_member_mappings_for_resource` / `get` / `post`.
- [ ] The inline `addRouteToSet` calls and `names` map in both methods are gone.
- [ ] dispatch/routing.test.ts stays green.
