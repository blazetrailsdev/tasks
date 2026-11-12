---
title: "Test Array-subclass first credit; type AddressListStruct addresses"
status: done
updated: 2026-11-12
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10004
claim: "2026-11-11T20:11:30Z"
assignee: "mail-array-subclass-first-credit-test-and-address-struct-types"
blocked-by: null
closed-reason: null
---

## Context

trails#9950 added `Retriever#first` (`vendor/mail/2.8.1/lib/mail/network/retriever_methods/base.rb`). After that, `parity:api:calls` began scoring Ruby `Array#first` at `elements/address.rb:193`, `fields/common_address_field.rb:42` and `fields/sender_field.rb:43`. The PR made `checkerProvenKind` in `scripts/api-compare/extract-ts-api.ts` treat an Array subclass (`AddressContainer`) as "sized", but `extract-ts-api.test.ts` has no case for it. It also cast `addressList.addresses` in `packages/mail/lib/elements/address.ts` to `AddressStruct[]`, because `AddressListStruct` (`packages/mail/lib/parsers/address-lists-parser.ts:8`, a `Struct.new`) types its members as `any`.

## Acceptance criteria

- [ ] `extract-ts-api.test.ts` covers `xs[0] ?? null` on a class extending Array, credited as `first`.
- [ ] `AddressListStruct`'s `addresses` is typed `AddressStruct[]` at its source, and the cast in `elements/address.ts` is removed.
