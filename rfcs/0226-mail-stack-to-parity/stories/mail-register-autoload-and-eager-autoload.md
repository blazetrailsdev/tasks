---
title: "mail-register-autoload-and-eager-autoload"
status: draft
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
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

`vendor/mail/2.8.1/lib/mail.rb:23-37` defines `Mail.register_autoload(name, path)` (records `@@autoloads[name] = path`, then `autoload`) and `Mail.eager_autoload!` (`@@autoloads.each { |_, path| require(path) }`). Neither is ported: `pnpm parity:api --package mail` lists `register_autoload` and `eager_autoload!` missing in `mail.rb`, and `packages/mail/lib/mail.ts` has no autoload table. `ActionMailer.eager_load!` (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer.rb:64-65`) calls `Mail.eager_autoload!` between `super` and the `Base.descendants` loop; `packages/actionmailer/lib/action-mailer.ts` (trails#9945) omits that call because the callee does not exist.

## Acceptance criteria

- [ ] `Mail.registerAutoload` / `Mail.eagerAutoloadBang` ported on the `Mail` literal in `packages/mail/lib/mail.ts`, with the gem's autoload registrations (awaited `import()` per CLAUDE.md's adapter-load precedent).
- [ ] `ActionMailer.eagerLoadBang` calls `await Mail.eagerAutoloadBang()` at action_mailer.rb:65's position.
- [ ] mail.rb's two missing rows are matched.
