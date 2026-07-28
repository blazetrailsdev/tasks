---
title: "reference-definition-columns-named-underscore-columns"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ReferenceDefinition` has a private `columns`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:280-286`),
called by `add` (`:220`), `add_to` (`:234`) and `column_names` (`:292`). trails
names the same method `_columns`
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:811`,
called at `:717`, `:733`, `:801`).

Surfaced on PR #5480, which ported `ReferenceDefinition#add`. That port converged
7 wide call-mismatch baseline entries, but `add` -> `columns` still flags,
precisely because our `add` calls `_columns()` and the call-set comparison
matches on Rails names. So the remaining baseline entry is not real drift — it is
the underscore.

Check for a collision before renaming: `TableDefinition`/`Table` in the same file
have their own `columns` surface, and `ReferenceDefinition` also has
`columnNames()` / `columnName()`. If the underscore turns out to be load-bearing,
the alternative is to document it and keep the ratchet entry with an accurate
reason string instead of the generic RFC 0047 seed text.

## Acceptance criteria

- [ ] `ReferenceDefinition#_columns` is renamed to `columns` (matching Rails), or
      the reason it cannot be is recorded at the call site.
- [ ] If renamed, the `add` -> `columns` entry is dropped from
      `scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/abstract/schema-definitions.json`
      and `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` stays green.
- [ ] `pnpm api:compare --package activerecord` shows no new extra surface.
