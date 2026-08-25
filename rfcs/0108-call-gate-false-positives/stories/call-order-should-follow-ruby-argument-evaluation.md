---
title: "Call-order comparison should follow Ruby argument-evaluation order, not TS token order"
status: done
updated: 2026-08-17
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6404
claim: "2026-08-17T16:56:50Z"
assignee: "call-arg-comparator-attr-reader-false-positives"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6292, which inlined `AbstractMysqlAdapter#_execMutation` into
direct `this.execute(sql)` calls to match Rails
(`activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`,
e.g. `change_column_default`:

    execute "ALTER TABLE #{quote_table_name(table_name)} #{change_column_default_for_alter(table_name, column_name, default_or_changes)}"

The port is now call-for-call identical, yet the call-sequence comparison flags
four bodies as ORDER-only mismatches, and the PR had to baseline them:

- `connection-adapters/abstract-mysql-adapter.ts` `change_column` `order:quoteTableName,execute`
- `connection-adapters/abstract-mysql-adapter.ts` `change_column_default` `order:changeColumnDefaultForAlter,execute`
- `connection-adapters/abstract-mysql-adapter.ts` `change_column_null` `order:quoteColumnName,execute`
- `connection-adapters/abstract-mysql-adapter.ts` `rename_column` `order:renameColumnForAlter,execute`

The cause is the comparator, not the port. Ruby evaluates the interpolated
arguments (`quote_table_name`, `*_for_alter`) _before_ `execute`, so the Ruby
call order is `quote_table_name, change_column_default_for_alter, execute`. The
TS extractor orders by source position, and in
an `execute` whose template argument interpolates `quoteTableName`, the
`execute` token comes first. No rewrite of the TS body can match: hoisting the
fragment into a local (what the port does today) or inlining an `await` inside
the template both leave `execute` textually ahead of its own arguments.

This will recur in every `execute "...#{helper(...)}..."` body across the
adapters, so each one costs a baseline row that can never be converged.

## Converged shape

Make the call-order comparison reflect evaluation order rather than token
order: when a call's arguments contain nested calls, emit the nested calls
before the enclosing call on the TS side (matching how the Ruby extractor
already reads an interpolated argument list). Then delete the four baseline
rows above — they are the acceptance evidence.

Related: `ts-extractor-emit-call-arguments` /
`ruby-extractor-emit-call-arguments` in this RFC touch the same extractor seam.

## Acceptance criteria

- [ ] A TS body that interpolates a helper call into an `execute` argument
      produces the call order helper-then-execute, matching Ruby's evaluation
      order for the equivalent interpolated string.
- [ ] The four `abstract-mysql-adapter.ts` rows listed above are deleted from
      `scripts/api-compare/call-mismatches-exclude/` by hand (only-shrink; no
      `--write` reseed) and `pnpm parity:api:calls` stays green.
- [ ] No new ORDER-only rows appear elsewhere from the change.

## Re-verified 2026-08-17 (draft sweep)

Still valid as a class, but **all four cited rows are gone** from
`call-mismatches-exclude/activerecord/connection-adapters/abstract-mysql-adapter.json`
(11 rows today, none of them `order:`). Do not start from those four.

Fresh population measured 2026-08-17: **38 `order:` rows across 28 shards**,
including `activerecord/relation/query-methods.json`,
`connection-adapters/postgresql/oid/type-map-initializer.json`,
`encryption/encryptable-record.json`, `actiondispatch/middleware/ssl.json`.
Re-derive which of those are Ruby-argument-evaluation-order artifacts (the
interpolated-argument shape the original four had) versus genuine order
divergence — that triage is now the first task of this story.

_Moved from RFC 0025 in the 2026-08-17 scoping split: RFC 0025 had grown to 262
stories. This story is a call-gate **false positive** — the tool reports a
mismatch where the port is faithful — which is the whole scope of the new RFC._
