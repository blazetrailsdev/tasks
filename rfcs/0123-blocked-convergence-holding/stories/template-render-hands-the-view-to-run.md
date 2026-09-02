---
title: "template-render-hands-the-view-to-run"
status: blocked
updated: 2026-09-02
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: "2026-09-02T00:37:12Z"
assignee: "actionview-partial-renderer-bodies-pass-rails-arguments"
blocked-by: "The view/template context-field half has already landed: template/handlers.ts no longer carries RenderContext#view or RenderContext#template (TemplateHandler is Rails' `call(template, source)`), and Template#render hands the view to view._run(methodName, this, locals, buffer, ...) exactly as template.rb:280-284 does. The one residual receipt, @missingRailsArgs _run on base.ts, is the has_strict_locals: kwarg, and that is a Ruby-kwarg shortcoming: base.rb:265-276's strict arm exists only to splat locals as keyword arguments and convert the resulting ArgumentError into a StrictLocalsError. A JS compiled method has no keyword parameters and raises no ArgumentError for a missing/extra local, so the tse compiler emits the check into the template body and raises StrictLocalsMismatch there; passing the kwarg would add a parameter with no arm to select."
closed-reason: null
---

## Context

`template-render-takes-view-before-locals` swapped `Template#render`'s own
parameters into Rails' order — `render(view, locals)`
(`vendor/rails/actionview/lib/action_view/template.rb:159`) — and deleted the
`@missingRailsArgs` receipt at
`packages/actionview/src/renderer/template-renderer.ts`. It did NOT change how
the _handler_ below it is invoked, and three receipts that cite that story by
slug describe exactly that residue. They are re-pointed here so the closing
story leaves no stale reference.

Rails renders a template by handing the view to a compiled method:
`Template#render` calls `view._run(method_name, self, locals, buffer, ...)`
(`template.rb:159-180`), and `Base#_run(method, template, locals, buffer, ...)`
(`actionview/lib/action_view/base.rb:261-282`) swaps in the buffer and the
current template and invokes the compiled method with the view as `self`.

trails compiles nothing at that layer: `Template#render`
(`packages/actionview/src/template.ts:127-156`) calls
`handler.render(source, locals, { ...view, controller, action, format, yield,
templatePath })` — source plus locals plus a context object that the view and
the template ride along on. Three receipts record the consequences:

- `packages/actionview/src/template/handlers.ts:38` — `RenderContext#view`, an
  extra field that exists only because the view is not a parameter.
- `packages/actionview/src/template/handlers.ts:47` — `RenderContext#template`,
  the same for the template `Rails` passes as `_run`'s second argument.
- `packages/actionview/src/base.ts:372` — `@missingRailsArgs _run`, on the
  `_run` port itself.

## Acceptance criteria

- `Template#render` reaches the handler the way Rails reaches the compiled
  method: the view and the template are arguments, not context fields, or the
  divergence is a `pnpm tasks block` naming the language shortcoming.
- The two `@noRailsEquivalent` receipts in `template/handlers.ts` and the
  `@missingRailsArgs _run` receipt in `base.ts` are deleted, not re-pointed
  again.
- `pnpm parity:api:extra --package actionview` does not grow; `parity:api:calls`
  and `parity:api:calls:args` report no new row.
- No test renamed; `pnpm parity:api` methods/arity/params figures unmoved.
