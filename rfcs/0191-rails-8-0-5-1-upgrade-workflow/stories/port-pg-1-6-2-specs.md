---
title: "Port pg v1.6.2's new and changed specs"
status: in-progress
updated: 2026-11-23
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: ["pg"]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#10636
claim: "2026-11-23T10:32:25Z"
assignee: "port-pg-1-6-2-specs"
blocked-by: null
closed-reason: null
---

## Context

The pg pin moved v1.5.9 → v1.6.2 in the dependent-source bump bundle (RFC 0191 § 1).
That PR converged the one drifted body (`Connection#cancel`, `vendor/pg/v1.6.2/lib/pg/connection.rb:615-673`,
keeping the PostgreSQL < 17 pure-Ruby arm since trails has no libpq) and re-pinned it.
The spec side was not ported: `git diff --no-index --stat vendor/pg/v1.5.9/spec vendor/pg/v1.6.2/spec`
shows 18 files, +981/-386, and the dry-run report
`scripts/parity/bump-ledger/reports/pg-v1.5.9-v1.6.2.2026-11-22.json` counts tests 741 → 799
(+66/-8, 3 changed, 16 moved). New files: `spec/pg/cancel_connection_spec.rb` (unported
`lib/pg/cancel_connection.rb`); the bulk is `spec/pg/type_spec.rb`, `result_spec.rb` and `connection_spec.rb`.

## Acceptance criteria

- [ ] Every v1.6.2 spec on surface trails scores (trails#10601 narrowed it to what the adapters call) is ported or
      receipted; moved/renamed examples follow their new names.
- [ ] `cancel_connection.rb` is ported only if an adapter path calls it; otherwise its row is recorded per trails#10601.
- [ ] `pnpm parity:test --package pg` delta non-negative; `pnpm parity:changed` green.
