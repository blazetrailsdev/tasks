---
title: "Port the field specs left over from the address fields port"
status: ready
updated: 2026-11-01
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9539 ported mail's field bases and address fields but left three groups of spec examples unported, with no story naming them:

- field specs that build a message through `Mail.new`; they need `packages/mail/src/mail.ts` to answer `Mail.new`
- the `InReplyToField` specs, `vendor/mail/*/spec/mail/fields/in_reply_to_field_spec.rb`; `packages/mail/src/fields/` has no `in-reply-to-field.ts`
- the field specs that iterate an address field with a block (`each`-style)

Check `mail-date-and-message-id-fields-and-field-specs-remainder` and `mail-message-core` first, and drop anything they already cover.

## Acceptance criteria

- `InReplyToField` is ported from `lib/mail/fields/in_reply_to_field.rb`, with its spec.
- The `Mail.new` and block-iteration examples are ported under their spec names, once `Mail.new` exists.
- `pnpm parity:test` deltas are non-negative for `mail`.
