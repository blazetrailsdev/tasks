---
title: "ImplicitRender is dead code: an action with no explicit render returns an empty 200"
status: done
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionpack"]
deps: ["execute-tse-templates"]
deps-rfc: []
est-loc: 150
priority: 6
pr: 7305
claim: "2026-08-31T17:10:47Z"
assignee: "wire-implicit-render-into-controller-dispatch"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/metal/implicit-render.ts` is dead
code on `main`: nothing imports it.

```console
$ grep -rn "implicit-render" packages/*/src --include=*.ts | grep -v "implicit-render.ts:"
(no output)
```

So an action written the Rails way — `async index() {}` with no explicit
`render` — returns an empty 200 instead of rendering `index.html.tse`.

Rails mixes `ActionController::ImplicitRender` into `ActionController::Base`
(`vendor/rails/actionpack/lib/action_controller/base.rb`, the `MODULES` list),
and `BasicImplicitRender#send_action`
(`actionpack/lib/action_controller/metal/basic_implicit_render.rb:6-9`) is:

```ruby
def send_action(method, *args)
  super.tap { default_render unless performed? }
end
```

with `ImplicitRender#default_render`
(`actionpack/lib/action_controller/metal/implicit_render.rb:32-58`) branching on
`any_templates?` / `template_exists?` / `interactive_browser_request?` and
raising `ActionController::MissingExactTemplate` otherwise.

The fix, and the divergences it surfaces, are on the unmerged branch
`twitter-app-full-stack-11518d` (commit `5fbfe1886`, PR #6470, closed) — a
working reference, not authoritative on fidelity:

- `defaultRender`'s messages read `controllerName` where Rails reads
  `self.class.name`.
- its request predicates call `isGet()` / `xhr()` where trails' `Request`
  exposes both as boolean getters.
- `render()` with no render key bypasses the `LookupContext` for the legacy
  static `templateResolver`.

## Dependencies

Depends on `execute-tse-templates` — without an executable handler an
implicitly-rendered template still cannot produce a body.

## Acceptance criteria

- `ActionController::Base` includes the `ImplicitRender` surface and
  `_dispatchAction` wraps the action per `BasicImplicitRender#send_action`
  (`default_render unless performed?`).
- An action with no explicit `render` renders its template through the
  `LookupContext`.
- `defaultRender`'s branch order, messages and error class match
  `implicit_render.rb:32-58`, reading `self.class.name` and the trails
  `Request` getters.
- Tests cover the implicit-render arm and the `MissingExactTemplate` arm.
