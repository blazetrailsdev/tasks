---
title: "action-controller-render-is-untyped"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

On a controller, `this.render` is typed `(...args: unknown[]) => void | Promise<void>`,
so nothing checks `render({ action: "new", status: "unprocessable_entity" })`
(the scaffold's failure branch) or `render({ partial, locals })`. Rails:
`ActionController::Rendering#render(*args)`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/rendering.rb:165`) and
`AbstractController::Rendering#render(*args, &block)` (`abstract_controller/rendering.rb:26`),
whose options normalize through `_normalize_args` / `_normalize_options`.

Found auditing the types of a freshly scaffolded app (`trails new blog` + `generate scaffold Post title:string body:text`) on `main` `53a6249ae6`, while writing the README for PR #8195.

## Converged shape

`render` keeps Rails' positional forms (`render("action")`, `render(options)`),
with a typed options object: `action`, `template`, `partial`, `locals`,
`status` (a `Rack::Utils::SYMBOL_TO_STATUS_CODE` key spelling or a number), `layout`,
`formats`, `plain`, `html`, `json`, `body`, `location` and `content_type`, and a typed return.
`locals` can link to `TemplateRegistry` / `TemplateLocals` the way the `.tse` `render` already does.

## Acceptance criteria

- [ ] `this.render({ action: "new", status: "unprocessable_entity" })` type-checks,
      and a misspelled option key or a wrong `status` value is a type error.
- [ ] Type tests cover the option keys above.
