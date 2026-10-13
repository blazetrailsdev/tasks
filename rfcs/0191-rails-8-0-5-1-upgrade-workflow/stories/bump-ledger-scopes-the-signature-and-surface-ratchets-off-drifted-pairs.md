---
title: "The parameter, block, arm and extra-surface ratchets skip a ledgered pair"
status: draft
updated: 2026-10-13
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: tooling
packages: [scripts]
deps: [bump-ledger-tracks-drifted-pairs-and-the-body-pins-gate-reads-it]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 3, ledger rule 3. Measured for `rails` `v8.0.2` → `v8.0.5.1`: 2
parameter-name, 4 block-parameter and 2 missing-throw arm dimensions grow
past their marks. The extra-surface ratchet stays green on this bump; on
`v8.1.4` it reports activerecord novel 0 → 22 and total 0 → 71, so it is
scoped here too. The
extra-surface rows are TS members whose Ruby method was removed or moved
upstream, which the ledger carries as `kind: "removed"`.

A signature can change with no body change, so a parameter or block row may
sit on a pair the DRIFT list does not name. The dry run's attribution decides
whether the seed needs a third kind for those.

## Acceptance criteria

- [ ] `lint-param-names.ts`, `lint-block-params.ts`, `lint-arm-throws.ts` and
      `lint-extra-surface-ratchet.ts` do not count a ledgered pair. The marks
      in `param-name-mark.ts`, `extra-surface-mark.json` and their siblings
      are not edited.
- [ ] A package pinned at `novel === 0` stays pinned: only a member whose pair
      is a `removed` ledger row is subtracted.
- [ ] The PR body gives, from the dry run, how many of the 2 parameter and 4
      block dimensions are on drifted pairs. If any is not, the seed gains a
      `kind: "signature"` row for it and
      `bump-ledger-tracks-drifted-pairs-and-the-body-pins-gate-reads-it`'s
      schema is extended here.
- [ ] Each lint prints how many rows it skipped for the ledger.
- [ ] The dry run, with the ledger seeded, reports these gates green for
      `rails` at `v8.0.5.1`.
- [ ] Tests cover one skipped row and one still-counted row per lint.

## Definition of done

A raised mark or a `:tighten` run that writes a mark up does not close this
story.
