---
title: "The bump ledger: drifted and removed method pairs are tracked rows, and the body-pins gate reads them"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: tooling
packages: [scripts]
deps: [bump-dry-run-runs-the-gates-against-a-candidate-ref]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 3 "The bump ledger". `lint-body-pins.ts` exits 1 on any DRIFT or STALE
pin (`scripts/api-compare/lint-body-pins.ts:74-112`). For `rails` `v8.0.2` →
`v8.1.4` that is 728 DRIFT and 125 STALE across 288 Ruby files, which is the
burn-down's worklist and cannot be cleared in one PR. This story adds the
ledger and teaches the one gate that defines it. The other ratchets follow in
`bump-ledger-scopes-the-call-ratchets-off-drifted-pairs` and
`bump-ledger-scopes-the-signature-and-surface-ratchets-off-drifted-pairs`.

Blocked on the RFC's Open question 1: do not start before the owner rules.

## Acceptance criteria

- [ ] `scripts/parity/bump-ledger/<source>.json` holds rows keyed
      (`package`, `rubyFile`, `rubyName`) with `kind: "drift" | "removed"`,
      `from`, `to` and an optional `story`. A shared reader exposes "is this
      pair ledgered" to the other lints. With no file, every gate behaves
      exactly as today.
- [ ] `lint-body-pins.ts` reports a ledgered pair as a ledger row and exits 0
      for it. An unledgered DRIFT or STALE is still red.
- [ ] A ledger gate runs in `rails-comparison` and reds on: a row whose pin
      matches the active digest (stale); a row with no matched pair; a row
      added by a commit that does not change that source's `ref` in
      `vendor/sources.lock.json`.
- [ ] On a PR that does change a `ref`, the gate also recomputes the seed from
      the two refs with the dry run and reds on any difference. It does not
      fetch the old ref on any other PR.
- [ ] A PR whose merge base predates the lockfile `ref` it is tested against
      and which edits `scripts/api-compare/body-pins.json` fails with a
      message telling it to rebase.
- [ ] `body-pins.ts --pin <ruby-file>` deletes the ledger rows it clears.
- [ ] Tests cover each red arm of the ledger gate.

## Definition of done

An environment flag that downgrades the body-pins gate to a warning does not
close this story. The ledger is the only new input, and it only shrinks.
