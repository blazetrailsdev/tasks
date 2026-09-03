---
title: "LookupContext sheds its invented render/find* surface onto the renderers"
status: draft
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`LookupContext` in Rails is a lookup object: `find` / `find_all` / `exists?` /
`any?` / `normalize_name` / `detail_args_for`
(`vendor/rails/actionview/lib/action_view/lookup_context.rb:129-146,209-225`).
Rendering lives elsewhere — `TemplateRenderer#render`
(`actionview/lib/action_view/renderer/template_renderer.rb:6-25`),
`PartialRenderer`, `CollectionRenderer`, and `find_layout` / `resolve_layout`
on `TemplateRenderer` (`template_renderer.rb:88-104`).

trails' `LookupContext` additionally carries a whole renderer:
`render`, `renderPartial`, `renderCollection`, `renderTemplate`,
`renderPartialSync`, `renderTemplateSync`, `findTemplate`, `findPartial`,
`findLayout`, `setLayout`, `getLayout` and a `layoutName` field — none of which
Rails' `LookupContext` has. `parity:api:extra` scores them, and the two `*Sync`
entry points already carry `@noRailsEquivalent PERMANENT` receipts for the
async-boundary half of the problem; the rest have no receipt.

`lookup-context-render-takes-rails-prefixes-and-formats` (#7454) widened
`render` / `findTemplate` / `findPartial` / `findLayout` to take `prefixes` as
a list and the formats cascade, which is the shape `find` / `findAll` already
had — the story's own acceptance criteria offered "or are deleted in favour of
the already-Rails-shaped `find` / `findAll`" as the alternative, and widening
was chosen to keep the PR to one story. Now that the signatures agree, the
deletion is mechanical rather than a rewrite.

## Converged shape

`findTemplate` / `findPartial` / `findLayout` fold into their one-line
`findAll(...)[0]` bodies at the call sites (`template-renderer.ts`,
`streaming-template-renderer.ts`, `digestor.ts`), and the layout lookup moves
onto `TemplateRenderer#findLayout` / `#resolveLayout`, which already exists and
already does this. `render` / `renderPartial` / `renderCollection` move onto
`TemplateRenderer` / `PartialRenderer` / `CollectionRenderer`, and
`layoutName` / `setLayout` / `getLayout` go with them —
Rails' layout is an argument to `render`, not `LookupContext` state.

The `*Sync` pair is the one part that stays, on its existing PERMANENT
receipt: a compiled template calls back synchronously and trails' render path
is async.

## Acceptance criteria

- `LookupContext` exposes no member Rails' `LookupContext` lacks except the
  two `*Sync` entry points and whatever already carries a receipt.
- The layout state (`layoutName` / `setLayout` / `getLayout`) is gone; callers
  pass the layout to the renderer as Rails does.
- `pnpm parity:api:extra --package actionview` drops by the removed names.
