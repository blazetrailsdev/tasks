---
title: "template-new-takes-rails-positional-arguments"
status: in-progress
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8177
claim: "2026-09-27T02:27:48Z"
assignee: "port-the-rest-of-asset-tag-helper-and-asset-url-helper"
blocked-by: null
closed-reason: null
---

# Template constructor takes Rails' positional arguments

## Context

Rails' `ActionView::Template#initialize(source, identifier, handler, locals:, format: nil, variant: nil, virtual_path: nil)`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb`) takes `source`, `identifier` and `handler`
positionally. trails' `Template` (`packages/actionview/src/template.ts`, `constructor(opts: TemplateOptions)`)
takes one options hash, so every `Template.new` call site is a `shape` row for `parity:api:calls:args`:

- `packages/actionview/src/testing/resolvers.ts` `NullResolver#findTemplates`
  (`vendor/rails/v8.0.2/actionview/lib/action_view/testing/resolvers.rb:38-42`), receipted
  `@missingRailsArgs new — CONVERGEABLE` against this story.
- `packages/actionview/src/unbound-template.ts` `bindLocals` / `build_template`, receipted
  `@missingRailsArgs new — PERMANENT` (that receipt should become this story's).

`TemplateOptions` also carries fields Rails' constructor does not (`extension`, `fullPath`,
`isLayout`, `isPartial`).

## Acceptance criteria

- `new Template(source, identifier, handler, { locals, format, variant, virtualPath })` mirrors
  `template.rb`'s signature; every caller is converted.
- The `@missingRailsArgs new` receipts at the call sites above are removed and
  `pnpm parity:api:calls:args` stays green.
