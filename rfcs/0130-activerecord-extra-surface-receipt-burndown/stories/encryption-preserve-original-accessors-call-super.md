---
title: "encryption-preserve-original-accessors-call-super"
status: draft
updated: 2026-09-22
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

`packages/activerecord/src/encryption/encryptable-record.ts`
`overrideAccessorsToPreserveOriginal` now `include`s a real `Module`, but its
reader calls `this.readAttribute(name)` and its writer `this.writeAttribute(name, value)`
where Rails calls `super()` / `super(value)` (`encryption/encryptable_record.rb:112,121`).
`Module#superMethod` (`packages/ruby-compat/src/include.ts`) resolves only
function-valued entries; there is no accessor-pair equivalent, so a getter/setter
in a module link cannot reach the next accessor in the ancestry.

## Acceptance criteria

- ruby-compat can resolve the next reader/writer after a module's link for an
  accessor pair (the `super` of a generated attribute reader/writer).
- The encryption reader/writer call that `super` in place of
  `readAttribute`/`writeAttribute`.
