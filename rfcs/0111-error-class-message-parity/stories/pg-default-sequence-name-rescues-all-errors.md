---
title: "PG defaultSequenceName swallows every error, not just StatementInvalid"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: exclude-burndown
deps: []
deps-rfc: []
est-loc: 50
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `default_sequence_name` in PR #5389 (RFC 0072 story
`converge-pg-sequence-and-schema-qualified-name-helpers`).

Rails rescues exactly one error class
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:301-309`):

```ruby
def default_sequence_name(table_name, pk = "id")
  ...
rescue ActiveRecord::StatementInvalid
  PostgreSQL::Name.new(nil, "#{table_name}_#{pk}_seq").to_s
end
```

trails uses a bare `catch {}`
(`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`,
`defaultSequenceName`), so _any_ failure — a connection error, a pool checkout
failure, a programming error in the ported body — is swallowed and silently
converted into a guessed `"#{table}_#{pk}_seq"` string. That is a debuggability
hazard: a broken connection reports as a plausible-looking sequence name rather
than raising.

Note the analogous `rescue` in `pk_and_sequence_for` IS bare in Rails
(`rescue nil`), so this is specifically about `default_sequence_name`, where
Rails deliberately narrows it.

## Acceptance criteria

- `defaultSequenceName` catches only the trails analogue of
  `ActiveRecord::StatementInvalid` and rethrows everything else.
- A regression test asserts a non-StatementInvalid error propagates, and fails
  on the current bare-catch implementation.
- Test names match the Rails tests in
  `vendor/rails/activerecord/test/cases/adapters/postgresql/` where one exists
  (`test_default_sequence_name_bad_table` covers the StatementInvalid arm).

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
