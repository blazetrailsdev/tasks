---
title: "actionview-missing-throw-arms-need-strict-locals-kwargs-and-raising-find"
status: done
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 54
pr: trails#7706
claim: "2026-09-11T15:28:07Z"
assignee: "inline-store-nested-param-and-port-custom-param-encoder"
blocked-by: null
closed-reason: null
---

## Context

Split out of `burn-the-missing-throw-arms-in-actionview-and-the-controller-stack`:
these four missing-throw rows each need a mechanism trails does not have yet,
so none could converge in that PR.

- `actionview/base.ts#_run` — Rails `base.rb:261-282` calls the compiled method
  with `**locals` when `has_strict_locals:` and rescues `ArgumentError` into
  `StrictLocalsError` (`template/error.rb:30-39`). trails' `Template#render`
  (`template.ts:202`) never passes `has_strict_locals`, and compiled methods take
  no keyword arguments, so there is no ArgumentError to translate.
- `actionview/template.ts#compile` — `template.rb:510-538` rejects non-keyword
  strict-locals parameters with `ArgumentError "... set as non-keyword argument
for ... Locals can only be set as keyword arguments."`. Same missing
  kwargs-signature mechanism as `_run`.
- `actionview/renderer/template-renderer.ts#determineTemplate` —
  `template_renderer.rb:25-34`: `render file:` checks `File.exist?` and raises
  two different `ArgumentError`s (absolute vs. relative path). trails throws a
  plain `Error("render file: is not supported...")` and has no `RawFile` arm.
  The body is synchronous and trails only allows async fs, so this needs the
  existence check moved to a point that can await.
- `actionview/renderer/template-renderer.ts#resolveLayout` —
  `template_renderer.rb:92-113`: `ArgumentError` for absolute layout paths
  (trails throws plain `Error`), then `@lookup_context.find_template` with a
  `rescue ActionView::MissingTemplate` / `raise unless template_exists?`. trails
  uses `findAll(...)[0]` plus an invented `findLayout(layout, ["layouts"], ...)`
  fallback, so nothing raises `MissingTemplate` to rescue.

The two strict-locals rows (`_run`, `compile`) moved to
`actionview-strict-locals-kwargs-signature-and-strict-locals-error`: trails
compiles strict-locals templates with no signature at all, so they need a
kwargs port that does not fit alongside this one. This story keeps the two
renderer rows. `render file:` stays synchronous through ruby-compat
`File.isExist`, the same wrapper `RawFile#render` already reads through.

## Acceptance criteria

- [ ] `determineTemplate`'s `file:` arm returns `RawFile` or raises Rails' two
      `ArgumentError`s; `resolveLayout` raises Rails' `ArgumentError` and
      rescues a real `MissingTemplate` from `PathSet#find`. Each is covered by
      a test that fails on baseline.
- [ ] `pnpm parity:api:arms:throws:tighten` narrows
      `renderer/template-renderer.ts` to 0.
