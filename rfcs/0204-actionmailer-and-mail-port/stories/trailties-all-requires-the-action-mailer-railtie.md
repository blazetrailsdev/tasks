---
title: "trailties/all requires action_mailer/railtie, which its loadPath table omits"
status: draft
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/all.ts` mirrors `railties/lib/rails/all.rb`
(`vendor/rails/v8.0.2/railties/lib/rails/all.rb`): it requires each framework
railtie in turn and rescues `LoadError`. Its `loadPath` table has no
`"action_mailer/railtie"` entry, although `ActionMailer::Railtie` is ported at
`packages/trailties/src/trailties/action-mailer.ts` (trails#9763). So
`rbFRequire(loadPath, "action_mailer/railtie")` raises `LoadError`, the loop
swallows it, and an app that imports `@blazetrails/trailties/all` boots with no
mailer railtie. `config.actionMailer` is unset, and `action_mailer.set_configs`
never copies `smtpSettings`, `deliveryMethod` or `deliveryJob` onto
`ActionMailer::Base`.

Found by trailmap, its first mailer consumer: after `import
"@blazetrails/trailties/all"`, `Trailtie.subclasses()` lists every railtie but
ActionMailer's.

## Acceptance criteria

- `all.ts`'s `loadPath` maps `"action_mailer/railtie"` to
  `./trailties/action-mailer.js`, and the `export type {}` line for it sits
  beside the others.
- A test fails before the change: importing `@blazetrails/trailties/all` loads
  `ActionMailer::Railtie`, so `config.actionMailer` is defined.
