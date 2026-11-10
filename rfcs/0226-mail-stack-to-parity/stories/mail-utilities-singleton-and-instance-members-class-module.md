---
title: "mail-utilities-singleton-and-instance-members-class-module"
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

`vendor/mail/2.8.1/lib/mail/utilities.rb` defines `paren`, `bracket`,
`escape_paren`, `uri_parser` twice: as instance methods under `extend self`
(:108, :131, :155, :167) and again as `def Utilities.x` singletons with their
own bodies (:340-360, :466). `pick_encoding` is `Utilities.pick_encoding`
(:476) beside the private `BestEffortCharsetEncoder#pick_encoding` (:320), and
`charset_encoder` / `charset_encoder=` is a `class << self` accessor (:333).
trails' `Utilities` (`packages/mail/lib/utilities.ts`) is a plain-object module
holding one member per name, so `pnpm parity:api` (2026-11-10) still reports
these 8 at 48/56. Per CLAUDE.md § "A Ruby module is a JS object or a JS
class", a module with a singleton and an instance member of the same name is a
class module (`static readonly [classModule] = true`).

## Acceptance criteria

- [ ] `Utilities` is a class module: the instance bodies on its prototype, the
      `Utilities.x` bodies and the `charset_encoder` accessor as statics.
- [ ] `pnpm parity:api` shows `utilities.rb` 56/56.
