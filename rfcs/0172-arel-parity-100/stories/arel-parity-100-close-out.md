---
title: "arel: verify every parity axis at 100% and pin each gate at zero"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: closeout
packages: ["arel"]
deps:
  [
    "arel-port-bound-sql-literal-inspect-and-node-initialize-copy",
    "arel-visitor-dispatch-cache-and-visit-rescue-arm",
    "arel-converge-freeform-no-rails-equivalent-receipts",
    "arel-audit-permanent-receipts-against-claude-md",
    "arel-burn-moved-extra-surface-nodes",
    "arel-burn-moved-extra-surface-managers-collectors-namespaces",
    "arel-converge-moves-residue",
    "arel-score-core-object-names-nil-and-case-then",
    "arel-verify-and-pin-eql-hash-bodies",
    "arel-converge-missing-control-flow-arms",
    "arel-converge-invented-control-flow-arms",
    "arel-deps-lint-to-zero",
  ]
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

The last story of RFC 0172. Once its dependencies land, every arel axis in the RFC's § "Baseline"
table should read 100% / 0. This story re-measures on a clean build and turns each remaining
ratchet into a hard zero for arel so it cannot regress:

- `scripts/api-compare/extra-surface-mark.json` — arel becomes **rowless** (novel and total 0), the
  state activerecord reached under RFC 0130.
- `arm-throw-mark.json`, `block-param-mark.json`, `param-name-mark.json` — arel at 0.
- `call-mismatches-exclude/arel/` — no shard.
- body pins 100%.

## Acceptance criteria

- [ ] `pnpm build && pnpm parity:api` reports arel methods, files, inheritance, arity, params and pins all at 100% (methods 1048/1048 and pins 763/763 once the four `nil?`/`then` definitions are scored), and global skip 0.
- [ ] `pnpm parity:api:calls`, `:calls:args`, `:params`, `:predicates`, `:extra:gate` (arel rowless), `:arms:throws`, `:blocks`, `:pins`, `:receipts:gate` all green with arel at 0.
- [ ] `pnpm parity:test` arel 739/739 and `pnpm parity:test:assertions` arel 0/0/0 (already true; re-verified).
- [ ] `pnpm parity:api:arms:report --package=arel`, `parity:api:moves`, `parity:api:deps` show no arel rows.
- [ ] Every remaining arel receipt is `PERMANENT` and cited against its CLAUDE.md section in the PR body.
- [ ] RFC 0172's README `status` flips to `closed` with the final table.
