---
title: "Retake the body-pin floor so no matched Rails body is unpinned at the flip"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: entry
packages: [scripts, activerecord, activesupport, actionpack, actionview, activejob, trailties]
deps:
  [
    entry-check-data-layer-parity-is-closed-on-8-0-2,
    bump-ledger-scopes-the-method-ratchets-off-drifted-pairs,
    bump-ledger-scopes-the-test-ratchets-off-changed-rails-tests,
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

RFC § 4, criterion 2. The ledger is seeded from pin DRIFT, so a matched pair
with no pin can change upstream without a row. 898 matched pairs under the
`rails` source are unpinned on 2026-10-13: activerecord 178, activesupport 82,
actiondispatch 92, actioncontroller 72, abstractcontroller 9, actionpackversion
1, actionview 299, activejob 3, trailties 162. 77 of them change in v8.1.4 and
carry 13 of the 183 new gate rows.

CONTRIBUTING.md "Body pins" defines a floor pin as "this is the tree we ported
against", with no `reason`. That is true of every unpinned pair while `ref` is
still `v8.0.2`.

## Acceptance criteria

- [ ] `pnpm parity:api:pins:all` is run on a `main` whose `rails` ref is
      `v8.0.2`, and only `scripts/api-compare/body-pins.json` changes.
- [ ] `pnpm parity:api` reports 0 unpinned for arel, activemodel,
      activerecord, activerecord-test-support, activesupport, actiondispatch,
      actioncontroller, abstractcontroller, actionpackversion, actionview,
      activejob and trailties.
- [ ] No existing pin's `reason` or digest changes; the diff only adds rows
      at `ref: v8.0.2`.
- [ ] The dry run's unattributed residue for `rails` at `v8.1.4` is 0 rows on
      unpinned pairs.

## Notes

Merge this as late as possible before the tag: a pair matched after it merges
is unpinned again. Pins for the non-Rails gems are out of scope; each gem's
bump retakes its own floor.
