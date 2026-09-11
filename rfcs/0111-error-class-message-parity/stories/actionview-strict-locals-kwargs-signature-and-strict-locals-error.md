---
title: "actionview-strict-locals-kwargs-signature-and-strict-locals-error"
status: done
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7711
claim: "2026-09-11T17:53:34Z"
assignee: "actionview-missing-template-rails-constructor"
blocked-by: null
closed-reason: null
---

## Context

Split out of `actionview-missing-throw-arms-need-strict-locals-kwargs-and-raising-find`
(the renderer half — `render file:` and `resolve_layout` — shipped there).

- `packages/actionview/src/base.ts#_run` — Rails `actionview/lib/action_view/base.rb:261-282`
  takes `has_strict_locals:`, calls the compiled method with `**locals`, and rescues the
  `ArgumentError` raised at that call frame into `StrictLocalsError`
  (`template/error.rb:30-39`). trails' `Template#render` (`template.ts:202-233`) never
  passes `has_strict_locals`, and `compiledSource()` (`template.ts:~279`) emits
  `function m(localAssigns, outputBuffer)` with no keyword signature, so no
  ArgumentError exists to translate. `_run` also still carries a
  `@missingRailsArgs _run — CONVERGEABLE template-render-hands-the-view-to-run` receipt.
- `packages/actionview/src/template.ts#compile` — `template.rb:510-538` inspects the
  compiled method's `parameters`, rejects non-keyword strict-locals params with
  `ArgumentError "#{names.to_sentence} set as non-keyword argument(s) for #{short_identifier}. Locals can only be set as keyword arguments."`,
  and sets `@strict_local_keys`. Tests: `actionview/test/template/template_test.rb:201,208`.

Both need the same mechanism: the `locals: (foo:, bar: 1)` signature compiled into a
JS kwargs-equivalent (destructured object parameter with required-key checks raising
Ruby's `ArgumentError` messages — `missing keyword: :foo`, `unknown keyword: :baz`).

## Acceptance criteria

- [ ] Compiled strict-locals templates take their locals as keyword arguments; a missing/unknown local raises `ArgumentError` at the `_run` call site.
- [ ] `_run` takes `hasStrictLocals` and translates that ArgumentError into `StrictLocalsError` with Rails' message.
- [ ] `compile` raises the non-keyword `ArgumentError` with Rails' message; the two `template_test.rb:201,208` tests are ported by name and fail on baseline.
- [ ] `pnpm parity:api:arms:throws:tighten` narrows actionview to 0.
