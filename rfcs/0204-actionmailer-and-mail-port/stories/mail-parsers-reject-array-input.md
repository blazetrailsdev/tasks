---
title: "mail-parsers-reject-array-input"
status: draft
updated: 2026-10-31
rfc: "0204-actionmailer-and-mail-port"
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

`CommonField#value=` keeps an Array (`vendor/mail/2.8.1/lib/mail/fields/common_field.rb:34`), and `CommonAddressField#element` hands it to `AddressList.new` (`common_address_field.rb:27`). Ruby raises there. `packages/mail/src/parsers/address-lists-parser.ts` accepts it through `b(data)` and parses a joined string. Reported by the trails#9539 review. Only the setter reaches this; the constructor joins Arrays through `encode_if_needed`.

## Acceptance criteria

- [ ] `field.value = [...]` on an address field raises as Ruby does.
