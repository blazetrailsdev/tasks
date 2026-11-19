---
title: "mail drops its unused @blazetrails/activesupport dependency"
status: done
updated: 2026-11-19
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: trails#10303
claim: "2026-11-18T17:21:20Z"
assignee: "mail-drop-unused-activesupport-dependency"
blocked-by: null
closed-reason: null
---

## Context

trails#10269 removed mail's last import of `@blazetrails/activesupport` (`packages/mail/lib/multibyte/unicode.ts` used to delegate compose/decompose to `ActiveSupport::Multibyte::Unicode`). `grep -rl @blazetrails/activesupport packages/mail/lib packages/mail/test` is now empty, but `packages/mail/package.json` still lists the dependency. The mail gem (`vendor/mail/2.8.1/mail.gemspec`) does not depend on activesupport.

## Acceptance criteria

- [ ] `@blazetrails/activesupport` is removed from `packages/mail/package.json` (and any tsconfig project reference), lockfile updated.
- [ ] `pnpm build` and the mail tests stay green.
