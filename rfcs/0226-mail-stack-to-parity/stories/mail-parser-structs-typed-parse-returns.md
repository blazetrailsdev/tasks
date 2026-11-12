---
title: "Type the remaining mail parser structs and parse returns"
status: draft
updated: 2026-11-12
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10004 added `STRUCT_MEMBER_TYPES` to `scripts/mail-parsers/generate.ts`: a parser whose struct is listed there gets member types through ruby-compat's `Struct.new<M, T>` and a typed `parse` return (`InstanceType<typeof XStruct>`). Only `AddressListStruct` is listed. The other ten generated parsers in `packages/mail/lib/parsers/*-parser.ts` (content-disposition, content-location, content-transfer-encoding, content-type, date-time, envelope-from, message-ids, mime-version, phrase-lists, received) still emit `parse(...): any`. So every caller reads their structs as `any`, and the call gates cannot prove a native read, as `elements/address.ts` could not before #10004. `AddressStruct` (same file) also keeps its members `unknown`.

Each struct's member types come from its Ragel source, `vendor/mail/2.8.1/lib/mail/parsers/*.rl`, e.g. `message_ids_parser.rl` (`MessageIdsStruct = Struct.new(:message_ids, :error)`, where `message_ids` is an Array of Strings).

## Acceptance criteria

- [ ] Each remaining parser struct has an entry in `STRUCT_MEMBER_TYPES`, with each type justified by the `.rl` action that assigns it, and `parse` returns the typed struct.
- [ ] `AddressStruct`'s members are typed where the `.rl` makes them determinable.
- [ ] Casts and `any` reads at callers in `packages/mail/lib/` that the new types make redundant are removed; `pnpm mail:parsers --check`, the mail typecheck and `parity:api:calls` stay green.
