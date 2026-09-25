---
title: "assert_valid_deferrable: use inspect, not JSON.stringify"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8056
claim: "2026-09-24T21:03:36Z"
assignee: "move-mysql-foreign-keys-onto-abstract-mysql-adapter"
blocked-by: null
closed-reason: null
---

## Context

Rails `postgresql/schema_statements.rb:1031-1035` and `sqlite3/schema_statements.rb:211` raise with `deferrable.inspect`. trails' `assertValidDeferrable` (postgresql/schema-statements.ts ~:678, sqlite3/schema-statements.ts ~:375) uses `JSON.stringify(deferrable)`, so a bad string value renders `"foo"` where Ruby renders the Symbol/String inspect form.

## Acceptance criteria

- Use the repo's `inspect` (activesupport/ruby-compat) in both messages, like Rails' `deferrable.inspect`.
- Test with a non-boolean invalid value in unique/exclusion constraint tests.
