---
title: "foreign-key-defined-for-validate-fetch-fallback"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3813
claim: "2026-06-21T17:42:42Z"
assignee: "foreign-key-defined-for-validate-fetch-fallback"
blocked-by: null
---

## Context

Follow-up surfaced during PR #3809 (foreign-key-defined-for-slice-stored-option-keys).
That PR made `ForeignKeyDefinition.isDefinedFor` slice the six generic option
keys to those a definition actually stores, mirroring Rails' `defined_for?`
`options.slice(*self.options.keys)`. The `validate` keyword has the identical
"not stored on mysql/sqlite" property but is handled on a _different_ Rails
code axis and was left untouched.

Rails `defined_for?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:165`):

```ruby
(validate.nil? || validate == self.options.fetch(:validate, validate)) &&
```

When `:validate` is NOT in the options hash, `fetch(:validate, validate)` falls
back to the _passed lookup value_, so the comparison is trivially true (matches).
Only PG introspection stores `:validate` (`options[:validate] = row["valid"]`,
`postgresql/schema_statements.rb`); mysql `foreign_keys`
(`abstract_mysql_adapter.rb`) and sqlite `foreign_keys` (`sqlite3_adapter.rb`)
do NOT set it.

trails (`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`,
`isDefinedFor`) always compares `options.validate === undefined || options.validate === this.validate`,
and the mysql (`mysql/schema-statements.ts`) and sqlite (`sqlite3-adapter.ts`)
introspection paths construct with the default `validate = true`. So
`isDefinedFor({ validate: false })` returns `false` on mysql/sqlite where Rails
returns `true`.

Low impact: like the generic-key slice, this only manifests for a `validate`
lookup against an mysql/sqlite-introspected (or hand-built) FK that didn't
store `:validate` — not a typical `foreignKeyExists?` call.

## Acceptance criteria

- [x] `isDefinedFor` mirrors `validate == self.options.fetch(:validate, validate)`:
      when the definition did not store `validate`, a `validate` lookup is
      ignored (matches), rather than compared against the defaulted `true`.
- [x] Track `validate` storedness alongside the existing `storedOptionKeys`
      mechanism (PG introspection stores it; mysql/sqlite do not; DSL/add paths
      store it only when explicitly passed, matching `foreign_key_options`).
- [x] Preserve existing element-wise comparison semantics for the other keys.
- [x] No test-name changes; verify on all three adapters.
