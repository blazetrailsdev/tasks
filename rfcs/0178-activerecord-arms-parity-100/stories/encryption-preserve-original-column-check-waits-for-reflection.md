---
title: "activerecord: preserve_original_encrypted's column check waits for reflection through invented bookkeeping"
status: draft
updated: 2026-10-04
rfc: "0178-activerecord-arms-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `preserve_original_encrypted`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encryptable_record.rb:61-70`)
checks the `original_<name>` column once, at declaration:

```ruby
if !ActiveRecord::Encryption.config.support_unencrypted_data && !column_names.include?(original_attribute_name.to_s)
  raise Errors::Configuration, "To use :ignore_case for '#{name}' you must create an additional column named '#{original_attribute_name}'"
end
```

`column_names` loads the schema in line. In trails a class-body `encrypts` runs
before the schema cache is warm (CLAUDE.md § "Schema reflection peeks at a warm
cache"), so `preserveOriginalEncrypted`
(`packages/activerecord/src/encryption/encryptable-record.ts`) adds three
things Rails does not have:

- a per-class `_ignoreCasePreservedAttributes` Set it adds `name` to,
- a `columnNames.length !== 0` test that skips the raise while the columns are
  unknown,
- `EncryptableRecord.requireOriginalColumnPresent` /
  `requireOriginalColumnsAfterReflection`, which re-run the raise from
  `applyColumnsHash` once the schema is reflected. Their receipts are in the
  non-canonical `CONVERGEABLE <prose>` form.

## Acceptance criteria

- [ ] The missing-column raise has one site with Rails' guard, reached when the
      columns are known, and `preserveOriginalEncrypted` carries no
      `_ignoreCasePreservedAttributes` bookkeeping.
- [ ] `requireOriginalColumnPresent` and `requireOriginalColumnsAfterReflection`
      are deleted, or carry a canonical receipt naming the story that removes them.
- [ ] `git grep encryption-preserve-original-column-check-waits-for-reflection`
      returns nothing.
