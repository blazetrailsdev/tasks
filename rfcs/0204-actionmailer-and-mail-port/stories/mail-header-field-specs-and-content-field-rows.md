---
title: "mail-header-field-specs-and-content-field-rows"
status: draft
updated: 2026-11-02
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps:
  - mail-content-type-disposition-id-and-parameter-hash
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

`mail-header-field-and-field-list` shipped `Header`, `Field`, `FieldList` (`packages/mail/src/header.ts`, `field.ts`, `field-list.ts`) at the 800 LOC ceiling, with a subset of the specs. `FIELDS_MAP` in `field.ts` has no `content-disposition`, `content-type` or `content-id` rows, because those classes are unported (`mail-content-type-disposition-id-and-parameter-hash`, which also carries `IndifferentHash`); until they land those headers parse as `OptionalField` and `Header#set`'s charset arm answers nothing. Field classes seat on `Mail` at the bottom of their file, and `field.ts` reads the seat at call time.

## Acceptance criteria

- After the content fields land: the three rows are added to `Field.FIELDS_MAP`, each class seats on `Mail`.
- The rest of `vendor/mail/2.8.1/spec/mail/header_spec.rb`, `field_spec.rb` is ported with verbatim names into `packages/mail/src/header.test.ts` and `field.test.ts`, including binary-input arms (`"Subject: \xAF"`, `Field.parse` of a BINARY raw).
- `Field.split` and `Header`'s `Uint8Array` header text are handled as those specs need.
