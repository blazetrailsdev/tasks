---
title: "Audit the canonical fixture ref rewrite against Rails YAML (label vs literal)"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7723 converged fixture row building onto `FixtureSet::TableRows` / `TableRow`
(`vendor/rails/activerecord/lib/active_record/fixture_set/table_row.rb`), which resolves a
belongs_to label with `ActiveRecord::FixtureSet.identify(value, fk_type)` alone
(`table_row.rb:160-166`) and composite keys with `composite_identify` (`:151-158`). trails'
`resolveFixtureId` declared/pinned-id lookup was deleted with it.

A scan found 183 of 294 canonical `ref()`s pointing at rows that pin an explicit id, and a
script rewrote them to literals. That rule is right only where Rails' own YAML writes a
literal (`vendor/rails/activerecord/test/fixtures/accounts.yml:3` `firm_id: 1`;
`categories_posts.yml:5` `post_id: 1`; `books.yml:2` `author_id: 1`). It is WRONG where Rails
resolves a label, and two files were caught only because a gate flagged them:

- `courses.yml:4` writes `college: FIU` (association label → `identify`), not `college_id: 1`.
  Restored to `ref("colleges", "FIU")` in `packages/activerecord/src/test-helpers/fixtures/courses.ts`.
- `peoples_treasures.yml:2-3` writes `<%= ActiveRecord::FixtureSet.identify(:michael) %>`.
  Restored to `ref("people", "michael")`.

Both were found by the fixtures-parity ratchet dropping below its baseline. A file that was
ALREADY `DIFF` on main can absorb the same mistake without moving that number, so the
remaining ~176 rewrites are unaudited.

## Converged shape

For every fixture module changed by that rewrite, compare against its
`vendor/rails/activerecord/test/fixtures/*.yml` counterpart column by column:

- Rails writes a literal id → the TS module carries the same literal.
- Rails writes a bare label under an association name, or an explicit
  `FixtureSet.identify(:label)` → the TS module carries `ref(table, label)`, which now
  resolves identify-only and is the faithful port.

`pnpm parity:fixtures` must not regress (baseline: 135 match / 8 diff), and each corrected
file should move toward MATCH rather than merely holding the count.

## Acceptance criteria

- [ ] Every canonical fixture module rewritten by #7723 is checked against its Rails YAML.
- [ ] Label-resolved columns carry `ref()`; literal columns carry the literal.
- [ ] `pnpm parity:fixtures` match count is >= baseline and no file regresses.
