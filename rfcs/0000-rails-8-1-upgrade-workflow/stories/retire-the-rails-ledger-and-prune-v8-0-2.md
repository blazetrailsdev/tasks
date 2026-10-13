---
title: "Close out: the Rails ledger is empty and deleted, v8.0.2 is pruned, the floor is retaken at v8.1.4"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: burn-down
packages: [scripts]
deps:
  [
    generate-the-rails-8-1-burn-down-stories,
    reread-the-recited-rails-citations-against-v8-1-4,
    document-the-minor-bump-runbook,
  ]
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

RFC § 3 rule 6 and § Verification. This is the last story. It waits on the
generated burn-down RFC, which cannot be named in `deps-rfc` until it has a
number; add that edge with `tasks set-deps-rfc` when it does.

## Acceptance criteria

- [ ] `scripts/parity/bump-ledger/rails.json` has no rows and is deleted.
- [ ] `pnpm parity:api:pins` reports 0 DRIFT and 0 STALE; pairs matched
      during the burn-down are pinned with `pnpm parity:api:pins:all`.
- [ ] `git grep 'vendor/rails/v8\.0\.2'` is empty.
- [ ] No call, argument, ruby-compat-call, parameter, block, arm,
      extra-surface or assertion baseline or mark is wider than at the
      `rails-8.0.2` tag. The PR body shows the comparison per file.
- [ ] `pnpm vendor:fetch --prune --source rails` is run in the main
      checkout, and the runbook names it as the step every other checkout
      runs.
- [ ] The `mirrors` fields drop `"verifying": true`.
- [ ] The RFC's Changelog records the dates of the tag, the flip and the
      close, and the final `parity:api` / `parity:test` rows.

## Definition of done

Deleting ledger rows whose units were not re-verified does not close this
story; the ledger gate's stale check is what proves each one.
