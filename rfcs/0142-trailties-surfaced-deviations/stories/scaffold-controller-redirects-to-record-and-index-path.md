---
title: "Scaffold controller redirects to the record and <index>_path, not string URLs"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8221. Rails' scaffold controller
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/scaffold_controller/templates/controller.rb.tt`)
redirects with:

- `redirect_to <%= redirect_resource_name %>` in `create` / `update` (`:28,37`). That is `@post`, from
  `ResourceHelpers#redirect_resource_name` → `model_resource_name(prefix: "@")`
  (`railties/lib/rails/generators/named_base.rb`).
- `redirect_to <%= index_helper %>_path` in `destroy` (`:46`).

trails' scaffold controller
(`packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts`, `crudMethods`)
emits string URLs instead: ``this.redirectTo(`/posts/${this.post.id}`, …)`` and `this.redirectTo("/posts", …)`.
The reason is that `ActionController::Base#redirectTo` (`packages/actionpack/src/action-controller/base.ts`) is typed
`redirectTo(options: string, …)`. `metal/redirecting.ts` already ports `_computeRedirectToLocation`, which
resolves a record through `polymorphic_url`, but the scaffold cannot pass a record through `Base#redirectTo`.
The receiver side is `split-redirect-to-into-redirecting-and-flash` (RFC 0141).

`NamedBase#modelResourceName` and `#indexHelper` already exist
(`packages/trailties/src/generators/named-base.ts`), and the TSE scaffold views use them.

## Acceptance criteria

- `create` / `update` emit `this.redirectTo(this.<singular>, …)` through a ported `redirectResourceName`
  (`ResourceHelpers`), and `destroy` emits the `<indexHelper>Path()` route helper, as `controller.rb.tt:28,37,46` do.
- `scaffold_controller_generator_test.rb`'s `redirect_to @user` / `redirect_to users_path` assertions
  (`:39,45,52`) are ported into "controller skeleton is created".
- A dispatch test shows the emitted `create` redirecting to `/posts/:id`.
