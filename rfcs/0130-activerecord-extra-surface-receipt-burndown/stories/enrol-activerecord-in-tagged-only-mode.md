---
title: "Move activerecord from COUNTED_PACKAGES to TAGGED_ONLY_PACKAGES"
status: ready
updated: 2026-09-11
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps:
  [
    "receipt-package-root-base-fixtures-enum-errors",
    "receipt-connection-adapters-and-sqlite-drivers",
    "receipt-associations-and-join-dependency",
    "receipt-encryption-and-type-virtualization",
    "receipt-relation-delegation-and-relation-tree",
  ]
deps-rfc: []
est-loc: 40
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The last story of the RFC, and deliberately tiny: once every preceding phase has
landed, `pnpm parity:api:extra --package activerecord --novel-only` reports
`totalNovel: 0` and the package qualifies for the mode arel already runs in.

The change is in `scripts/api-compare/extra-surface-mark.ts`:

- move `"activerecord"` from `COUNTED_PACKAGES` to `TAGGED_ONLY_PACKAGES`;
- keep the `activerecord` row in `scripts/api-compare/extra-surface-mark.json`.
  An earlier draft of this story said to delete it under a `strandedMarks`
  check; no such check exists. Tagged-only mode pins only `novel`, and `total`
  stays gated in both modes (see the TAGGED-ONLY MODE module comment), so a
  tagged-only package keeps its row exactly as arel and ruby-compat do, and
  `unmarkedPackages` fails the gate if the row is missing;
- update the module comment, the `Extra-surface ratchet` step comment in
  `.github/workflows/ci.yml`, and CLAUDE.md's step 4 so all three name
  activerecord as tagged-only.

Enrollment is only-grow, exactly like RFC 0121's: after this lands, a new public
activerecord name with no Ruby counterpart reds the gate and the ONLY remedies
are a `@noRailsEquivalent` receipt at the declaration or deleting the name.
There is no number to raise and no path back to counted mode.

This also retires the merge-conflict source the RFC exists for: the pin stops
the burndown traffic that rewrote the row, which leaves only a genuine
relocation able to move `total`.

## Acceptance criteria

- `pnpm parity:api:extra:gate` is green and its summary reads
  `activerecord novel 0/0 (pinned)`.
- `scripts/api-compare/extra-surface-mark.json` keeps its `activerecord` row,
  whose `total` stays gated.
- A deliberately added untagged public name in a Rails-matched activerecord file
  reds the gate with the UNRECEIPTED message — verified locally and stated in
  the PR body, since a gate that cannot be shown to fail is not armed.
- CLAUDE.md, the CI step comment, and the `extra-surface-mark.ts` module comment
  all describe activerecord as tagged-only.
