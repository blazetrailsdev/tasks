---
title: "Type Message#get so a field's readers need no unknown cast"
status: done
updated: 2026-11-15
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 4
pr: trails#10145
claim: "2026-11-15T19:32:24Z"
assignee: "mail-message-spec-fixture-loop-covers-all-gem-emls"
blocked-by: null
closed-reason: null
---

## Context

`Message#[]` (`vendor/mail/2.8.1/lib/mail/message.rb`, `def [](name)` → `header[underscoreize(name)]`) answers the header's field, and specs read it directly: `mail.parts.first[:content_type].content_type` (`spec/mail/mime_messages_spec.rb:424,509-510,525-526`). trails' `Message#get` (`packages/mail/lib/message.ts:623`) is typed `Field | Field[] | null`, and `Field` does not expose the wrapped field's members. So every port of that read needs `get("content_type") as unknown as ContentTypeField` (`packages/mail/test/mime-messages.test.ts`), and `example-emails.test.ts` hides it behind an `any` helper.

## Acceptance criteria

- [ ] `Message#get` / `Header#get` (or `Field`) are typed so that a field's own reader (`contentType()` on a Content-Type field) is reachable without an `unknown` cast. Two ways to do it: forward the wrapped field's members the way `Mail::Field#method_missing` does, or type the result by field name.
- [ ] Remove the `as unknown as ContentTypeField` casts in `mime-messages.test.ts` and the `field()` `any` helper in `example-emails.test.ts`.
