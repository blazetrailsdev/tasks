---
title: "RenderedCollection#body drops Rails' .html_safe"
status: ready
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `RenderedCollection#body`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/abstract_renderer.rb:122-124`):

```ruby
def body
  @rendered_templates.map(&:body).join(@spacer.body).html_safe
end
```

trails' `RenderedCollection#body` (`packages/actionview/src/renderer/abstract-renderer.ts`)
returns `this.renderedTemplates.map((t) => t.body).join(this.spacer.body.toString())`, a
plain `string` with no `.html_safe`. So a rendered collection reaches its caller as an
unsafe string. `ActionView::Base#render` re-wraps it through `renderedBody`'s `htmlSafe`,
but any other consumer of `Renderer#renderPartial` / `renderToObject(...).body` sees a
string Rails would have marked safe. trails#8174 widened `RenderedTemplate#body` to
`string | SafeBuffer` and left this getter's return type at `string`.

## Acceptance criteria

- `RenderedCollection#body` returns `htmlSafe(...)` of the joined bodies, mirroring
  `abstract_renderer.rb:123`, typed `SafeBuffer`.
- A test pins that the body of a collection render is html-safe.
