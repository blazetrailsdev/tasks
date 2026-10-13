---
title: "Port test_resource_new_actions and test_resource_constraints_are_pushed_to_scope once Mapper#resources draws through collection/new/member"
status: draft
updated: 2026-10-13
rfc: "0163-actiondispatch-routing-parity"
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

`port-routing-test-mapper-skips-part-2` ported 16 of the 18 `TestRoutingMapper` stubs left in
`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb:2000-3249`. Two were written, failed on
the mapper, and were put back as `it.skip` in
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`:

- `test_resource_new_actions` (`:2050-2101`). `resource :admin, path_names: { new: "novo" },
path: "administrador"` generates `/pt/admin/novo/preview`; Rails generates
  `/pt/administrador/novo/preview`. `Mapper#resource`
  (`packages/actionpack/src/action-dispatch/routing/mapper.ts`) builds `basePath`, `collectionScope`,
  `memberScope` and `newScope` from `name` and reads `options.path` only for `ResourceLike#path`.
- `test_resource_constraints_are_pushed_to_scope` (`:3146-3166`).
  `resources :comments, only: [:create, :new]` defines no `wiki_article_comments_path`. Rails names
  the `create` route, because `collection { post :create }` runs `name_for_action`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1532-1535`) and the name is
  free when there is no `index`. `Mapper#resources` adds `create` with no name.

Both come from `resources` / `resource` building the canonical routes by hand, which
`mapper-resources-hand-builds-canonical-routes` converges.

## Acceptance criteria

- [ ] Both stubs are replaced by the Rails body and pass.
- [ ] No test name changes.
