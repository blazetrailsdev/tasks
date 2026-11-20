---
title: "ActionMailer::Base declares its callback class methods (beforeDeliver, beforeAction)"
status: draft
updated: 2026-11-20
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionMailer.Base` does not declare the class methods its callback modules install, so a mailer must cast `this` to call them:

- `AbstractController::Callbacks::ClassMethods#before_action` / `after_action` / `around_action` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/callbacks.rb`), used by mailers: `packages/actionmailer/test/parameterized.test.ts:25` casts `(this as unknown as { beforeAction(b: unknown): void })`.
- `ActionMailer::Callbacks::ClassMethods#before_deliver` / `after_deliver` / `around_deliver` (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/callbacks.rb`), ported at `packages/actionmailer/lib/callbacks.ts:18-36`, have no `declare static` on `packages/actionmailer/lib/base.ts`; `guides/action-mailer-basics.md` had to cast to call `afterDeliver`.

Converged shape: `declare static beforeDeliver: (typeof CallbacksClassMethods)["beforeDeliver"]` (and siblings), the shape `packages/actionmailbox/lib/base.ts:26-28` uses for `beforeProcessing`.

## Acceptance criteria

- [ ] `ActionMailer.Base` declares `beforeDeliver`, `afterDeliver`, `aroundDeliver` and the `beforeAction` / `afterAction` / `aroundAction` family as statics typed from their ClassMethods.
- [ ] The casts in actionmailer tests and in `packages/website/docs/guides/action-mailer-basics.md` are removed and still typecheck.
