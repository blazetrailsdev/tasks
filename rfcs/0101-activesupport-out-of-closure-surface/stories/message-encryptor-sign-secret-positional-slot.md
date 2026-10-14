---
title: "message-encryptor-sign-secret-positional-slot"
status: draft
updated: 2026-10-14
rfc: "0101-activesupport-out-of-closure-surface"
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

`MessageEncryptor`'s constructor (`packages/activesupport/src/message-encryptor.ts:68-90`) tells `signSecret` apart from an options hash with `typeof` and stores the result in a reassigned `opts` local. Rails' signature is `initialize(secret, sign_secret = nil, **options)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/message_encryptor.rb:183`). CLAUDE.md § "An optional positional before trailing options" says to keep each Rails parameter in its own slot and to have the caller pass `undefined` for a positional it skips. The inlined `Rotator#initialize` segment (trails#8889) has to strip `onRotation` out of that reassigned `opts`.

## Acceptance criteria

- The constructor is `(secret, signSecret = null, options = {})`, with no `typeof` arm.
- Callers pass `undefined` for the skipped `signSecret`.
- The `opts` local is gone, and the Rotator segment destructures `options` directly.
