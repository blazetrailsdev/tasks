---
title: "anyTemplates has no variant wildcard, so a variant-only template reads as no template"
status: closed
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionpack", "actionview"]
deps:
  - unify-lookup-context-resolver-protocols
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Converged in PR 6470: anyTemplates delegates to LookupContext#isAny, and the :any variants sentinel from detailArgsForAny globs variant files in FileSystemResolver."
---

## Context

`ActionController::Base#anyTemplates` sweeps the registered formats but has no
variant wildcard, so an action whose only template is variant-scoped —
`show.html+phone.tse` with no `show.html.tse` — reads as "no template at all".
Rails raises `UnknownFormat` in that case; trails falls through to
`MissingExactTemplate` or `head :no_content`.

Trails (`packages/actionpack/src/action-controller/base.ts`, `anyTemplates`):

```ts
return prefixes.some((prefix) =>
  ctx.formats.some((format) => ctx.findTemplate(action, prefix, String(format)) !== null),
);
```

`findTemplate` takes a concrete `variants` list. There is no `:any` spelling,
so a variant-only file is invisible here.

Rails deliberately widens every detail for this check.
`LookupContext#any?` uses `detail_args_for_any`, which sets `variants = :any`
(`actionview/lib/action_view/lookup_context.rb:188`), and
`ImplicitRender#default_render` relies on that to distinguish "wrong
format/variant" from "no template"
(`actionpack/lib/action_controller/metal/implicit_render.rb:40`).

## Converged shape

`anyTemplates` delegates to `LookupContext#isAny`, which already exists and
already uses `detailArgsForAny`, instead of sweeping formats by hand. That
requires the resolver-protocol unification, since `isAny` reads `_viewPaths`
and the controller's context is populated through `addResolver` — see
`unify-lookup-context-resolver-protocols`. Alternatively `TemplateResolver`
grows an `:any` variant sentinel that `FileSystemResolver` globs for.

## Acceptance criteria

- An action with only `show.html+phone.tse` and a non-variant request raises
  `UnknownFormat`, not `MissingExactTemplate`.
- `anyTemplates` no longer enumerates formats in the controller.
- Test covering variant-only templates in the `any_templates?` branch.
