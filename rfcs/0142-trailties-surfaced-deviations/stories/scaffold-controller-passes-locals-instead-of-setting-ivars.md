---
title: "scaffold-controller-passes-locals-instead-of-setting-ivars"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8221
claim: "2026-09-28T16:27:29Z"
assignee: "scaffold-controller-passes-locals-instead-of-setting-ivars"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `scaffold-views-diverge-from-rails-erb-templates`. That story ports the erb
scaffold templates (`railties/lib/rails/generators/erb/scaffold/templates/*.html.erb.tt`)
into `packages/trailties/src/generators/tse/scaffold/templates.ts`. The views now read
controller instance variables the way Rails' do: `@post` is `this.post` and `@posts` is
`this.posts` (`show.html.erb.tt:3,9`, `index.html.erb.tt:8`, `new.html.erb.tt:5`,
`edit.html.erb.tt:5,10`). TSE compiles a template `with (this)`, and
`AbstractController::Rendering#view_assigns` copies the controller's own properties onto
the view (`packages/actionpack/src/abstract-controller/rendering.ts` `viewAssigns`).

The controllers the scaffold emits do not set instance variables. `crudMethods` in
`packages/trailties/src/generators/rails/scaffold/scaffold-generator.ts`, and the
matching method bodies in
`packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts`,
build a local and pass it as `render({ action, locals: { post } })`. In the generated app,
`this.post` in the views is therefore undefined.

Rails' `scaffold_controller/templates/controller.rb.tt:3-60` sets `@<plural_table_name>`
in `index` (`:7`) and `@<singular_table_name>` in `new` / `create` (`:16,25`), plus the
`set_<singular_table_name>` `before_action` (`:3`) for show / edit / update / destroy. It
relies on implicit rendering and does not pass explicit `render` calls or locals.

## Acceptance criteria

- The scaffold controller sets `this.<plural_table_name>` / `this.<singular_table_name>`
  as `controller.rb.tt` does, including the `set_<singular>` before_action, and does not
  pass the record as a render local.
- A test generates a scaffold and asserts the controller assigns `this.post` / `this.posts`,
  which are the names the generated views read.
