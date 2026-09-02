---
title: "actionview-partial-renderer-bodies-pass-rails-arguments"
status: claimed
updated: 2026-09-02
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: "2026-09-02T00:37:12Z"
assignee: "actionview-partial-renderer-bodies-pass-rails-arguments"
blocked-by: null
closed-reason: null
---

## Context

Splitting the actionview partial renderers into Rails' three files
(`actionview-renderer-files-and-inheritance-follow-rails`) moved four
pre-existing call-ARGUMENT divergences out of
`call-mismatches-unreviewed/actionview/renderer/partial-renderer.json`'s mark
and into a shard that has none, so they surfaced as new rows on
`pnpm parity:api:calls:args`. They are held by `@missingRailsArgs CONVERGEABLE`
tags at their call sites pending this story; none of them is new code.

The four, against Rails:

- `renderer/partial-renderer.ts#render` calls `findTemplate(partial)`; Rails
  `partial_renderer.rb:230` calls `find_template(path, template_keys(path))`,
  and `template_keys(_)` (`partial_renderer.rb:241`) returns `@locals.keys` —
  the port has no `templateKeys` at all, and `ObjectRenderer#template_keys`
  (`object_renderer.rb:25`) / `CollectionRenderer#template_keys` override it.
- `renderer/object-renderer.ts#renderObjectWithPartial` calls
  `localVariable(partial, this.options)`; Rails' `local_variable(partial)`
  (`abstract_renderer.rb:129`) is an instance method reading `@options`.
- The same method renders inline where Rails' body ends in
  `render(partial, context, block)` (`object_renderer.rb:17`), i.e. the
  `PartialRenderer#render` it now inherits.
- `renderObjectDerivePartial` calls `partialPath(object, context,
contextPrefix)`; Rails' `partial_path(object, view)`
  (`object_rendering.rb`) takes two and derives the prefix itself.

## Acceptance criteria

- All four call sites pass Rails' argument lists; the `@missingRailsArgs` tags
  are deleted with the deviations.
- `localVariable` / `partialPath` reach `options` / the prefix the way Rails
  does (instance state), rather than through extra parameters.
- `templateKeys` is ported at Rails' name with the two subclass overrides.
- `pnpm parity:api:calls:args` and `pnpm parity:api:calls` show no new row;
  `pnpm parity:api:extra --package actionview` gains no novel name.
