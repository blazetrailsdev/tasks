---
title: "The bump ledger: drifted and removed method pairs are tracked rows, and the per-pair ratchets skip them until re-verified"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: tooling
packages: [scripts]
deps: [bump-dry-run-runs-the-gates-against-a-candidate-ref]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 3 "The bump ledger". A `ref` bump turns ten API-side gates red at once.
Measured for `rails` `v8.0.2` → `v8.1.4`: body pins 728 DRIFT and 125 STALE,
107 new call rows, 55 new argument-shape rows and 22 naming failures, 2
ruby-compat-call rows, 12 parameter-name and 8 block-parameter dimensions, and
extra surface on activerecord (novel 22, total 71) and arel (total 2). All 183
new call and argument rows sit on a pair whose Ruby body changed.

Blocked on the RFC's Open question 1: do not start before the owner rules.

## Acceptance criteria

- [ ] `scripts/parity/bump-ledger/<source>.json` holds rows keyed
      (`package`, `rubyFile`, `rubyName`) with `kind: "drift" | "removed"`,
      `from`, `to` and an optional `story`. With no file, every gate behaves
      exactly as today.
- [ ] `lint-body-pins.ts` reports a ledgered pair as a ledger row and exits 0
      for it. An unledgered DRIFT or STALE is still red.
- [ ] `lint-call-mismatches.ts`, `lint-call-args.ts` (shape and naming),
      `lint-ruby-compat-calls.ts`, `lint-param-names.ts`,
      `lint-block-params.ts`, `lint-arm-throws.ts`,
      `lint-extra-surface-ratchet.ts`, `receipt-audit.ts` and the reseed-drift
      step do not count a row on a ledgered pair. No exclude shard, mark or
      baseline file is read differently for any other pair.
- [ ] A ledger gate runs in `rails-comparison` and reds on: a row whose pin
      matches the active digest (stale); a row with no matched pair; a row
      added by a commit that does not change that source's `ref` in
      `vendor/sources.lock.json`; a seed that differs from what the dry run
      computes for the two refs.
- [ ] A PR whose merge base predates the lockfile `ref` it is tested against
      and which edits `scripts/api-compare/body-pins.json` fails with a
      message telling it to rebase.
- [ ] `body-pins.ts --pin <ruby-file>` deletes the ledger rows it clears.
- [ ] The dry run, with the ledger seeded, reports every API-side gate green
      for `rails` at `v8.1.4`.
- [ ] Tests cover each red arm of the ledger gate and one skipped row per
      ratchet.

## Definition of done

Raising a mark, adding an exclude row, or an environment flag that downgrades
a gate to a warning does not close this story. The ledger is the only new
input, and it only shrinks.

## Notes

The largest est-loc in the RFC. If it does not fit, ship the ledger file, its
gate and the body-pins arm, and file the per-ratchet arms as a follow-up story
in this RFC.
