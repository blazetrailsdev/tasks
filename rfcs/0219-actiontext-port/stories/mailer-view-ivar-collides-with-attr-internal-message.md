---
title: "mailer-view-ivar-collides-with-attr-internal-message"
status: done
updated: 2026-11-16
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10159
claim: "2026-11-15T22:36:38Z"
assignee: "actiontext-test-helper-boots-dummy-app"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actiontext/test/integration/mailer_render_test.rb` "uses default_url_options" drives the dummy `MessagesMailer#notification` (`vendor/rails/v8.0.2/actiontext/test/dummy/app/mailers/messages_mailer.rb:2-5`), which assigns `@message = params[:message]`, and the view `messages_mailer/notification.html.erb` reads `@message.content`.

In Ruby the ivar `@message` and `ActionMailer::Base`'s `attr_internal :message` (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/base.rb:636`, stored as `@_message`) do not collide. In trails, `packages/actionmailer/lib/base.ts:244-251` ports `attr_internal :message` as a `message` get/set pair over `_message`, so the dummy's `this.message = this.params.message` overwrites the Mail message and `mail()` fails at `wrapDeliveryBehavior` (`mail.deliveryMethod is not a function`, `packages/actionmailer/lib/delivery-methods.ts:49`). An own data property would shadow the getter that `mail()` reads (`base.rb:865-873` reads `message` too), and `viewAssigns` (`packages/actionpack/lib/abstract-controller/rendering.ts:82`) collects own keys.

`packages/actiontext/test/integration/mailer-render.test.ts` is parked as `it.skip` on this story.

## Acceptance criteria

- A mailer subclass can assign a view ivar named like an `attr_internal` member (`message`) without clobbering Base's `_message`, and the view sees the assigned value; or an operator ruling settles the collision as permanent.
- `mailer-render.test.ts` "uses default_url_options" un-skipped and passing, with the dummy mailer and view mirrored as written.
