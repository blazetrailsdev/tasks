---
title: "thread-request-variant-into-deferred-render"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
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

`ActionController::Base#renderAsync`
(`packages/actionpack/src/action-controller/base.ts`) resolves a deferred
template render through `LookupContext#render(controller, action, format,
locals, options)`, which threads only the **format** into the lookup:

```ts
this.body = await ctx.render(controllerPrefix, action, format, locals, {...});
```

`ctx.render` calls `findTemplate(action, controller, format)`, which is
`findAll(name, [prefix], false, [], { formats: [format] })` — the `variants`
detail is never passed.

`ImplicitRender#default_render`
(`vendor/rails/actionpack/lib/action_controller/metal/implicit_render.rb:36-38`)
DOES select on the variant:

```ruby
if template_exists?(action_name.to_s, _prefixes, variants: request.variant)
  render
```

so trails now has a split: `templateExists` finds
`index.html+mobile.tse` and answers true, then the bare `render` it guards
misses it and raises `ActionView::MissingTemplate`. Rails' `render` reaches the
same `lookup_context` whose details already carry `request.variant`, so the two
halves agree.

Surfaced while wiring ImplicitRender into controller dispatch (PR #7305) — the
`test_variant_with_implicit_template_rendering` arm of
`vendor/rails/actionpack/test/controller/mime/respond_to_test.rb:733` could not
be ported there because of this.

## Acceptance criteria

- The deferred-render path carries `variants` (and the rest of the request's
  lookup details) into the lookup the way Rails' per-request `lookup_context`
  does, so `template_exists?(..., variants:)` and the `render` it guards
  resolve the same template.
- `test_variant_with_implicit_template_rendering` and
  `test_variant_without_implicit_rendering_from_browser`
  (`respond_to_test.rb:733-744`) are ported and green.
