---
title: "render inline: returns raw source and render file: raises an invented error"
status: draft
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Base#render` gained Rails' per-option dispatch in PR 7439, mirroring
`TemplateRenderer#determine_template`
(`vendor/rails/actionview/lib/action_view/renderer/template_renderer.rb:16-52`).
Six of its seven branches are ported; two are not, and currently raise:

```ts
if (Object.hasOwn(hash, "file") || Object.hasOwn(hash, "inline")) {
  throw new Error(
    `render ${...} is not available on the synchronous view path; ...`,
  );
}
```

- `:file` builds `Template::RawFile.new(options[:file])` (`:26`), after an
  existence check that raises `ArgumentError, "File #{...} does not exist"`
  for an absolute path and a different message for a relative one
  (`:27-33`). trails reads files through the async fs backend, so neither the
  check nor the read is available synchronously.
- `:inline` builds `Template::Inline.new(options[:inline], "inline template",
  handler, locals: keys, format: format)` (`:35-42`), picking the handler with
  `Template.handler_for_extension(options[:type] || "erb")` and the format from
  `handler.default_format`. The compile itself is synchronous in trails
  (`Template#render` is), so this arm is reachable; only `:file` is genuinely
  blocked by the async fs rule.

The async `TemplateRenderer` (`packages/actionview/src/renderer/template-renderer.ts:41-52`)
already has both branches — `:file` throws its own "not supported" error there
too, and `:inline` returns the source verbatim without compiling it, which is
its own divergence from `Template::Inline`.

## Converged shape

Port the `:inline` arm on both paths: build a `Template` with the handler from
`handler_for_extension(options[:type] || "tse")` and render it, rather than
returning the raw source. Leave `:file` raising, but with Rails' own
`ArgumentError` messages (`:29`, `:31`) where the path shape can be judged
without touching the filesystem, so the error is Rails' rather than invented.

## Acceptance criteria

- `render inline:` compiles and renders through the handler, from a view and
  from the controller path, and a cover asserts the rendered output rather
  than the source.
- `render file:` raises Rails' `ArgumentError` text for the relative-path case.
- The invented "not available on the synchronous view path" message is gone
  from `packages/actionview/src/base.ts`.
