---
title: "Generated new/edit actions render explicitly where Rails' are empty"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' generated authentication actions with no work to do are empty, and
ActionController's implicit render fills them in:

```ruby
# railties/.../templates/app/controllers/sessions_controller.rb.tt:5-6
def new
end
```

`passwords_controller.rb.tt:6-7` and `:19-20` (`new`, `edit`) are the same.

trails has no implicit render on controller dispatch yet — that is
`wire-implicit-render-into-controller-dispatch` — so the authentication
generator emits an explicit call instead
(`packages/trailties/src/generators/rails/authentication/templates.ts`, the
`sessions_controller.rb` and `passwords_controller.rb` entries):

```ts
async new_(): Promise<void> {
  this.render({ action: "new" });
}
```

An empty body would be the faithful port, but today it would render nothing, so
the explicit render is load-bearing until implicit render lands. Once it does,
these three bodies should go back to being empty — otherwise the generator ships
a permanent divergence from the `.tt` files it mirrors, and every generated app
inherits it.

## Acceptance criteria

- After `wire-implicit-render-into-controller-dispatch`, the emitted
  `SessionsController#new_`, `PasswordsController#new_` and
  `PasswordsController#edit` have empty bodies, matching
  `sessions_controller.rb.tt:5-6` and `passwords_controller.rb.tt:6-7,19-20`.
- A generated app still renders the `new` and `edit` templates for those
  actions.
- The generator's snapshot test is updated to the empty bodies.
