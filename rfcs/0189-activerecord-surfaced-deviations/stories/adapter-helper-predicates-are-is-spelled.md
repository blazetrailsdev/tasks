---
title: "activerecord: AdapterHelper's predicates are spelled is*"
status: draft
updated: 2026-10-13
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AdapterHelper` (`vendor/rails/v8.0.2/activerecord/test/support/adapter_helper.rb:4-64`)
defines eight predicates: `current_adapter?`, `in_memory_db?`,
`sqlite3_adapter_strict_strings_disabled?`, `mysql_enforcing_gtid_consistency?`,
`supports_default_expression?`, `supports_non_unique_constraint_name?`,
`supports_text_column_with_default?`, `supports_sql_standard_drop_constraint?`.

`packages/activerecord/src/support/adapter-helper.ts` spells them bare
(`currentAdapter`, `inMemoryDb`, ...), where a Ruby `foo?` is `isFoo`
(root CLAUDE.md, "Did you port a Ruby predicate?"). trails#8875 exported them
as the `AdapterHelper` module that `ActiveRecord::TestCase` includes and
extends, so the spelling is now on the class. `currentAdapter` has about 70
call sites in test files and `inMemoryDb` about 88.

## Acceptance criteria

- [ ] Each `AdapterHelper` predicate is spelled `is*`, in the module and at
      every call site.
