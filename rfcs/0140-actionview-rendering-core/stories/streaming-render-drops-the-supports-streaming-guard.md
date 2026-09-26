---
title: "renderStream drops Rails' supports_streaming? half of the guard"
status: done
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: trails#8136
claim: "2026-09-26T09:02:05Z"
assignee: "port-mapper-app-name-from-class-name"
blocked-by: null
closed-reason: null
---

## Context

`StreamingTemplateRenderer#render_template`
(`vendor/rails/actionview/lib/action_view/renderer/streaming_template_renderer.rb:44-53`)
guards the streaming path on two conditions:

```ruby
def render_template(view, template, layout_name = nil, locals = {}) # :nodoc:
  return [super.body] unless layout_name && template.supports_streaming?
  ...
end
```

`packages/actionview/src/renderer/streaming-template-renderer.ts`'s
`renderStream` checks only `layoutName`:

```ts
if (layoutName == null || layoutName === false) {
  const body = await template.render(context, locals);
  yield body;
  return;
}
```

so a template whose handler does NOT support streaming is streamed anyway,
where Rails falls back to the non-streaming `TemplateRenderer` path. The
`supports_streaming?` half of the guard was never ported —
`Template#supports_streaming?` (`template.rb`) delegates to
`handler.respond_to?(:supports_streaming?) && handler.supports_streaming?`, and
only `Handlers::ERB` answers true
(`actionview/lib/action_view/template/handlers/erb.rb`).

This was noticed while converging `delayedRender`'s instrumentation in #7649;
the `layoutName` half of the guard was restored there, the
`supports_streaming?` half was left out of scope.

## Converged shape

Port `Template#supportsStreaming` and the handler predicate (trails' `Tse`
handler is the `ERB` counterpart, so it answers true), then spell the guard as
Rails does — one early return on `layoutName && template.supportsStreaming()`.

## Acceptance criteria

- `renderStream` returns the non-streaming body when the template's handler does
  not support streaming, per `streaming_template_renderer.rb:45`.
- `Template#supportsStreaming` and the handler-side predicate exist at their
  Rails names.
- A test covers a non-streaming handler with a layout name given.
