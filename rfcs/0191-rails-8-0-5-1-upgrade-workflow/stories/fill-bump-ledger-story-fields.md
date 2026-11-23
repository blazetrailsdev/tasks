---
title: "fill-bump-ledger-story-fields"
status: blocked
updated: 2026-11-23
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-23T01:14:06Z"
assignee: "bump-zeitwerk-to-2-7-3"
blocked-by: "waits on trails#10577 (generate-stories.ts not on main)"
closed-reason: null
---

## Context

Split from `generate-the-rails-8-0-5-1-burn-down-stories` (RFC § 7, item 4,
last criteria). The generator (`scripts/parity/bump-dry-run/stories.ts`,
`generate-stories.ts`) wrote the `rails-8-0-5-2-burn-down` RFC (tasks#373): 24
stories, ids `rails-8-0-5-2-<package>[-<subsystem>]`, each owning whole Ruby
files of `scripts/parity/bump-ledger/rails.json` / `rails.tests.json`. The
ledger rows (`PairSeedRow`, `TestSeedRow` in `scripts/parity/bump-dry-run/ledger.ts:28-43`)
have no `story` field, and `scripts/api-compare/lint-bump-ledger.ts` does not
check one.

## Acceptance criteria

- [ ] Once tasks#373 is merged and ingested, every row of `rails.json` and
      `rails.tests.json` carries `story: <id>`, written by the generator (a
      `--write-ledger` arm of `generate-stories.ts`, from the same plan that
      named the stories), not by hand.
- [ ] `lint-bump-ledger.ts` reds on a ledger row with no `story`, and on one
      whose story id is not in the tasks DB; tests cover both.
- [ ] `parity:bump:dry-run` seeds rows without `story`, and the flip PR's docs
      (vendor/README.md § "Upgrading a source") say the generator fills it.
