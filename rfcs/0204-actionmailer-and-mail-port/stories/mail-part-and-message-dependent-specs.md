---
title: "mail-part-and-message-dependent-specs"
status: draft
updated: 2026-11-02
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps:
  - mail-message-core
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

`mail-body-part-and-attachments` shipped `Body`, `PartsList` and `AttachmentsList` but not `Part`:
`vendor/mail/2.8.1/lib/mail/part.rb:7` is `class Part < Message`, and `Message` is
`mail-message-core`, which itself depends on that story. `Part`'s behaviour also needs
`ContentTypeField`, `ContentDispositionField` and `ContentIdField`, which are absent from
`Field.FIELDS_MAP` (`packages/mail/src/field.ts:70-85`) and sit in the draft story
`mail-content-type-disposition-id-and-parameter-hash`.

`packages/mail/src/mail.ts` declares `Mail.Part` and `Mail.Message` seats, unset until those ports land,
so `Body#splitBang` (`body.rb:253`), `AttachmentsList#set` and `Mail.new` raise `TypeError` today.

Temporary deviations to retire here: `PartsList` extends `Array` rather than
`DelegateClass(Array)` (`parts_list.rb:5`), because `DelegateClass` forwards neither `length`,
index reads nor iteration; and the `@missingRailsCall ... CONVERGEABLE mail-part-and-message-dependent-specs`
receipts on `Encodings.isDefined`, `UnstructuredField#fold`, `Unicode#tidyBytes` and the
`PartsList` constructor.

## Acceptance criteria

- `packages/mail/src/part.ts` ports `part.rb` at its Ruby names and seats `Mail.Part`.
- Every remaining arm of `body_spec.rb`, `part_spec.rb`, `parts_list_spec.rb` and
  `attachments_list_spec.rb` is ported and passes, with fixtures from `spec/fixtures`.
- Every receipt naming this story is gone.
