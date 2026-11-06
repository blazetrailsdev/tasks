---
title: "mail: converge missing calls in Encodings.defined?, UnstructuredField#fold, Unicode.tidy_bytes, PartsList#initialize"
status: done
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9781
claim: "2026-11-06T13:17:13Z"
assignee: "mail-message-spec-port-rest"
blocked-by: null
closed-reason: null
---

## Context

Four `@missingRailsCall … CONVERGEABLE` receipts in `packages/mail/src` cited `mail-message-spec-port`; trails#9766 re-pointed them at `mail-message-spec-port-remaining` only to keep the closing-story gate green. They are method-body debt, not spec porting:

- `packages/mail/src/encodings.ts:47` `isDefined` — missing `include?` from `Encodings.defined?` (`vendor/mail/2.8.1/lib/mail/encodings.rb:29-31`, `@transfer_encodings.include? get_name(name)`).
- `packages/mail/src/fields/unstructured-field.ts:68` `fold` — missing `map` (`vendor/mail/2.8.1/lib/mail/fields/unstructured_field.rb:102`).
- `packages/mail/src/multibyte/unicode.ts:149` `tidyBytes` — missing `map` (`vendor/mail/2.8.1/lib/mail/multibyte/unicode.rb:245`); currently delegates to ActiveSupport's.
- `packages/mail/src/parts-list.ts:15` constructor — missing `new` from `@parts = Array.new(*args)` (`vendor/mail/2.8.1/lib/mail/parts_list.rb:8-11`).

## Acceptance criteria

- Each body calls what the Rails/mail body calls (or the native form the call gates credit); the four receipts are deleted and `pnpm parity:api:calls` is non-negative.
