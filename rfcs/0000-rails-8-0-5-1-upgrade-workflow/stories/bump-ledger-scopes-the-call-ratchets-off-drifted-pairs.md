---
title: "The call, call-argument and ruby-compat-call ratchets skip a ledgered pair"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-0-5-1-upgrade-workflow"
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

RFC § 3, ledger rule 3. Measured for `rails` `v8.0.2` → `v8.0.5.1`: 22 new
call rows, 10 new argument-shape rows and 7 naming failures. All 39 sit on a
pair whose Ruby body changed: 37 on drifted pins and 2 on unpinned pairs. The
receipt audit and the ruby-compat-call ratchet stay green on this bump and go
red on `v8.1.4` (5 receipts, 2 rows), so they are scoped here too.

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
      `rails` at `v8.0.5.1`, and lists any row on a newly matched pair for
      the flip PR to fix.
- [ ] Tests cover one skipped row and one still-counted row per lint.

## Definition of done

Adding an exclude row or running `--write` does not close this story.
