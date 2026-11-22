---
title: "ActionMailer action class methods (method_missing) are statically typed"
status: draft
updated: 2026-11-22
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionMailer::Base.method_missing` (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/base.rb:623-629`) answers any name in `action_methods` with `MessageDelivery.new(self, method_name, ...)`, so `PostMailer.published(post)` is a class-level call. In trails the call has no static type, and every mailer has to write `declare static published: (post: Post) => MessageDelivery` (`examples/homepage/app/mailers/post-mailer.ts`). trails#10561 fixed the same gap for engine-installed `Base` class methods, using module augmentation, but augmentation cannot express a set of action names that is open.

## Acceptance criteria

- A mailer subclass's instance actions are callable as statics that return `MessageDelivery`, with no per-action `declare static`. For example, a typed `static`-side mapped over `this`'s prototype, or a trails-tsc virtualization like the one scopes get.
- `examples/homepage`'s `PostMailer` drops `declare static published` and still passes `pnpm typecheck`.
