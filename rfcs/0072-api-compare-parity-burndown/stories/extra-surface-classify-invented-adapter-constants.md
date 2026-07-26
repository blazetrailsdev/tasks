---
title: "extra-surface: classify the residual invented SCREAMING_CASE constants"
status: draft
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while implementing `extra-surface-allow-ruby-file-constants` (PR #5338).

That PR resolved the constants that Rails genuinely declares (activerecord
novel 776 -> 741). The spike story
`extra-surface-activerecord-top-files-inventory` had also flagged a residue of
SCREAMING_CASE novel names that are **not** in Rails at all — real trails
inventions — and #5338 deliberately left them alone, since feeding the allow-set
cannot and should not absolve them. They are still novel after the merge and
need a per-name verdict: relocate, delete, or allowlist-with-reason via
`scripts/api-compare/extra-surface-allow.json`.

The set (verified still novel at #5338):

- `connection-adapters/abstract-mysql-adapter.ts`: `CLIENT_NOT_CONNECTED_RE`
- `connection-adapters/abstract/connection-pool.ts`: `NULL_CONFIG`
- `transaction.ts` and `connection-adapters/abstract/transaction.ts`:
  `NULL_TRANSACTION`
- `associations/association-scope.ts` and
  `associations/disable-joins-association-scope.ts`: `INSTANCE`
- `connection-adapters/postgresql-adapter.ts`: `TYPE`

`INSTANCE` is the most interesting: Rails' `AssociationScope` uses
`INSTANCE = create` (a memoized singleton) — check
`vendor/rails/activerecord/lib/active_record/associations/association_scope.rb`
before classifying it as an invention; it may be a genuine port whose Ruby
declaration shape the extractor doesn't reach (`INSTANCE = create` has a call
RHS, which #5338's widening now records as `{kind: "expr"}` — so re-run the
extractor before assuming it is missing).

Also note `ER_TABLE_EXISTS` on the mysql adapter remains novel: confirm whether
Rails declares it (it was not in the vendored
`abstract_mysql_adapter.rb` constant block) or whether it is a trails addition.

## Acceptance criteria

- Each name above gets a verdict backed by a `vendor/rails/` citation
  (`file:line`) or an explicit "not in Rails" finding.
- Genuine ports are made to score allowed (relocate to the Rails-layout file,
  or fix the declaration shape); genuine inventions are deleted if unused, or
  added to `extra-surface-allow.json` with a reason.
- No name is left silently novel without a recorded decision.
- Record the activerecord novel delta. Baseline after #5338: 741 novel /
  2085 moved / 2826 total.
