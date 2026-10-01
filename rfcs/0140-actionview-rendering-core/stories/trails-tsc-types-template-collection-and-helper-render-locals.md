---
title: "trails-tsc: type the locals of template, collection/object and helper-module render sites instead of falling back to any"
status: ready
updated: 2026-10-01
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["trails-tsc"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8308 made a compiled view's unresolved bare name `never` once every render site that can
reach the template is resolved (`bindCheckedTypes`, `packages/trails-tsc/src/build-views.ts`).
Three kinds of render site are still handled by falling back to `any` rather than by typing the
locals they pass, and one kind is not seen at all:

- A template render that passes locals, from a view (`render({ template: "posts/show", locals })`)
  or a controller (`this.render("show", { locals })`), marks the target template unresolved
  (`renderSite`'s `{ template }` result). The hash is typeable exactly like a partial's
  (`Template#locals_code`, `vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:561-571`).
- A partial rendered with `collection:` / `object:` / `as:` is marked unresolved
  (`implicitLocals`). Rails binds a known set: the object local named by `as:` or the partial
  name, plus `<name>_counter` and `<name>_iteration` for a collection
  (`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/collection_renderer.rb`,
  `abstract_renderer.rb:43-51`).
- An object render with a second argument (`render(post, { compact: true })`) marks the model's
  partial unresolved instead of typing the passed hash.
- `render(...)` calls in `app/helpers/**` modules are not scanned, so a partial rendered only
  from a helper with locals reports its locals as `never`.

## Acceptance criteria

- [ ] Template renders with a typeable `locals` hash type the target template's locals, from
      views and controllers, and the template stays resolved.
- [ ] `collection:` / `object:` / `as:` renders declare the object local and, for a collection,
      the counter and iteration locals; the partial stays resolved.
- [ ] `render(object, locals)` types `locals` onto the model's partial.
- [ ] `app/helpers/**` modules are scanned for render sites.
- [ ] Tests in `packages/trails-tsc/src/build-views.test.ts` for each arm.
