---
title: "Type ActionView::Layouts' class-side layout on ActionMailer::Base"
status: draft
updated: 2026-11-11
rfc: "0226-mail-stack-to-parity"
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

`ActionMailer::Base` includes `ActionView::Layouts` (`packages/actionmailer/lib/base.ts:636`,
`include(Base, ActionView.Layouts)`; Rails `actionmailer/lib/action_mailer/base.rb:487`
`include ActionView::Layouts`), but the class-side `layout(layout, conditions = {})`
(`packages/actionview/lib/layouts.ts:66`; Rails `actionview/lib/action_view/layouts.rb:285`) is not on
`typeof Base`'s static type. Every mailer test that writes Rails' `layout "spam", except: [:logout]`
casts: `packages/actionmailer/test/mail-layout.test.ts:51`
(`this as unknown as ThisParameterType<typeof layout> & { layout: typeof layout }`) and
`packages/actionmailer/test/base.trails.test.ts:12`. `LayoutsClass` (`layouts.ts:33`) is not exported.

## Acceptance criteria

- [ ] `Base.layout("spam", { except: ["logout"] })` typechecks inside a mailer `static {}` block with no cast
      (the `ClassMethods` half typed through `Extended<>` / the settled mixin typing).
- [ ] Both casts above are removed.
