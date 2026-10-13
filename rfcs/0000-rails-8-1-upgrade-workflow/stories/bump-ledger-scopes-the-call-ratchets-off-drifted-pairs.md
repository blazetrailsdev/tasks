---
title: "The call, call-argument and ruby-compat-call ratchets skip a ledgered pair"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: tooling
packages: [scripts]
deps: [bump-ledger-tracks-drifted-pairs-and-the-body-pins-gate-reads-it]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 3, ledger rule 3. Measured for `rails` `v8.0.2` → `v8.1.4`: 107 new
call rows, 55 new argument-shape rows, 22 naming failures and 2 new
ruby-compat-call rows, with 5 receipts the audit then finds suppressing
nothing. All 183 new call and argument rows sit on a pair whose Ruby body
changed: 168 on drifted pins, 13 on unpinned pairs, 2 on newly matched pairs.

## Acceptance criteria

- [ ] `lint-call-mismatches.ts`, `lint-call-args.ts` (shape and naming),
      `lint-ruby-compat-calls.ts`, `receipt-audit.ts` and ci.yml's "Ratchet
      baseline reseed drift" step do not count a row on a ledgered pair, in
      either direction: no new row and no stale row is reported there.
- [ ] No exclude shard, mark or baseline file is read differently for any
      other pair, and none is edited by this story.
- [ ] Each lint prints how many rows it skipped for the ledger, so the
      suspended debt is visible in every CI log.
- [ ] The dry run, with the ledger seeded, reports these gates green for
      `rails` at `v8.1.4`, apart from rows on newly matched pairs, which it
      lists for the flip PR to fix.
- [ ] Tests cover one skipped row and one still-counted row per lint.

## Definition of done

Adding an exclude row or running `--write` does not close this story.
