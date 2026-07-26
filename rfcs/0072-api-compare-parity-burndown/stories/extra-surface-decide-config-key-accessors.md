---
title: "extra-surface: database.yml config-key accessors (statementLimit) have no Ruby def"
status: draft
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while landing `extra-surface-adapter-cross-file-recurring-names` (PR 5345).

Some trails adapter accessors mirror a `database.yml` **config key** rather than
a Ruby `def`. Rails reads them as `config[:statement_limit]` inside the adapter's
`initialize`, so there is no method for `scripts/api-compare/extract-ruby-api.rb`
to record and the faithful TS accessor scores as novel drift.

Live instance: `statementLimit` on `abstract-mysql-adapter.ts`,
`postgresql-adapter.ts` and `sqlite3-adapter.ts` — 3 allowlist entries in
`scripts/api-compare/extra-surface-allow.json`. Rails reads
`config[:statement_limit]` in `AbstractMysqlAdapter#initialize`,
`PostgreSQLAdapter#initialize` and `SQLite3Adapter#initialize`; trails exposes
the same setting as a validated getter/setter pair.

Before building anything, decide whether this is worth automating. Options, in
increasing cost:

1. Leave allowlisted — 3 entries, and the reason text is already accurate and
   traceable. Defensible; close this story as won't-do if so.
2. A small declared table of known config-key accessors, in the same spirit as
   the stdlib-mixin table from `extra-surface-admit-stdlib-comparable-operators`.
3. Teach the Ruby extractor to record `config[:key]` / `config.fetch(:key)`
   reads inside `initialize` as file-level pseudo-surface. Highest fidelity,
   but a genuinely new extraction axis and easy to over-match.

Prefer the cheapest option that removes the entries without inventing an
allow-set hole; the count is small, so option 1 is a legitimate outcome and
this story exists mainly so the decision is recorded rather than re-derived.

## Acceptance criteria

- A recorded decision among the options above, with reasoning.
- If automated: the mechanism is a declared, commented table or an explicit
  extraction rule — not a blanket allow — with tests, and the 3 `statementLimit`
  allowlist entries are deleted.
- If not automated: the story is closed won't-do with the reasoning, and the
  existing allowlist reasons are left as the record.
