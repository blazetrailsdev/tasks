---
title: "mail-address-spec"
status: draft
updated: 2026-10-30
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

`mail-elements` shipped `packages/mail/src/elements/address.ts` with the other eleven elements, but
`vendor/mail/2.8.1/spec/mail/elements/address_spec.rb` (769 lines) did not fit its 800 LOC ceiling.
A full port (80 tests, all green against that code) was run locally before it was dropped.
`break_down_to` (`vendor/mail/2.8.1/spec/matchers/break_down_to.rb`) is a local helper reading each
key off the address, as a call where it is a method (`address`, `displayName`, `local`, `domain`,
`format`). `Address#inspect` (`lib/mail/elements/address.rb`) is also worth one trails assertion.

## Acceptance criteria

- `packages/mail/src/elements/address.test.ts` ports every example in `address_spec.rb` with names verbatim, and passes.
