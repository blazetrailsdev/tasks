---
title: "Port Mail.defaults (instance_eval on Configuration.instance)"
status: done
updated: 2026-11-04
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#9707
claim: "2026-11-04T12:08:16Z"
assignee: "rack-builder-script-resolves-toplevel-constants"
blocked-by: null
closed-reason: null
---

## Context

`Mail.defaults(&block)` (vendor/mail/2.8.1/lib/mail/mail.rb:98-100) is `Configuration.instance.instance_eval(&block)`. It has no port in `packages/mail/src/mail.ts`. Because of that, the parked "should encode a non us-ascii filename" spec (packages/mail/src/fields/content-type-field.test.ts, from trails#9700) calls `Configuration.instance().paramEncodeLanguage("jp")` directly.

## Acceptance criteria

- `Mail.defaults(block)` is on the `Mail` namespace object. It runs the block with `this` bound to `Configuration.instance()`, the JS form of `instance_eval`.
- The content-type spec body calls `Mail.defaults(...)` as Rails does.
