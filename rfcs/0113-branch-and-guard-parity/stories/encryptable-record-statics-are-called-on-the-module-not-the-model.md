---
title: "encryptable-record-statics-are-called-on-the-module-not-the-model"
status: ready
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 67
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Encryption::EncryptedFixtures#process_preserved_original_columns`
(`vendor/rails/activerecord/lib/active_record/encryption/encrypted_fixtures.rb:26-34`)
asks the MODEL for the source attribute:

```ruby
if source_attribute_name = model_class.source_attribute_from_preserved_attribute(attribute_name)
```

`model_class` answers it because `ActiveRecord::Encryption::EncryptableRecord`
is included into `ActiveRecord::Base`
(`encryptable_record.rb`, `ActiveSupport.on_load(:active_record)`), so the
method is a class method of every model.

trails' port
(`packages/activerecord/src/encryption/encrypted-fixtures.ts:43-44`, landed by
`port-active-record-fixture-class-and-encrypted-fixtures-module`, PR #7617)
calls it on the module instead:

```ts
const sourceAttributeName = EncryptableRecord.sourceAttributeFromPreservedAttribute(attributeName);
```

because `EncryptableRecord`'s statics are not mixed onto `Base` in trails —
`packages/activerecord/src/encryption/encryptable-record.ts:41` declares
`sourceAttributeFromPreservedAttribute` as a static on the module class and no
model carries it. Every other call site in the repo has the same shape, so this
is the file-wide convention rather than a one-off, but it reads as a module
function where Rails reads as a model class method, and it means a model cannot
override it as Ruby allows.

## Converged shape

`EncryptableRecord`'s class-method half is mixed onto `Base` with
`extend()` / `Extended<>` from `@blazetrails/activesupport` (the mirror of Ruby
`extend`, per CLAUDE.md's "Module mixins" section), so the call site becomes
`modelClass.sourceAttributeFromPreservedAttribute(attributeName)` and the other
`EncryptableRecord.<static>(...)` call sites converge with it.

## Acceptance criteria

- [ ] `process_preserved_original_columns`'s call goes through `model_class`,
      matching `encrypted_fixtures.rb:29`.
- [ ] The sibling `EncryptableRecord.<static>(klass, ...)` call sites that pass
      the model as an argument are converged to the same shape, or the ones that
      cannot are listed with why.
- [ ] No new `parity:api:calls` / `:args` baseline rows.
