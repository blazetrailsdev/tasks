---
title: "Move activerecord from COUNTED_PACKAGES to TAGGED_ONLY_PACKAGES and delete its mark row"
status: draft
updated: 2026-08-30
rfc: "0000-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: ['receipt-package-root-base-fixtures-enum-errors','receipt-connection-adapters-and-sqlite-drivers','receipt-associations-and-join-dependency','receipt-encryption-and-type-virtualization','receipt-relation-delegation-and-relation-tree']
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

The change is three edits in `scripts/api-compare/extra-surface-mark.ts` and its
JSON:

- move `"activerecord"` from `COUNTED_PACKAGES` to `TAGGED_ONLY_PACKAGES`;
- delete the `activerecord` row from
  `scripts/api-compare/extra-surface-mark.json` — the gate's `strandedMarks`
  check fails the run if the row is left behind, so this is not optional;
- update the module comment, the `Extra-surface ratchet` step comment in
  `.github/workflows/ci.yml`, and CLAUDE.md's step 4 so all three name
  activerecord as tagged-only.

Enrollment is only-grow, exactly like RFC 0121's: after this lands, a new public
activerecord name with no Ruby counterpart reds the gate and the ONLY remedies
are a `@noRailsEquivalent` receipt at the declaration or deleting the name.
There is no number to raise and no path back to counted mode.

This also retires the merge-conflict source the RFC exists for: after this
story, the mark file holds `ruby-compat` alone.

## Acceptance criteria

- `pnpm parity:api:extra:gate` is green and its summary reads
  `activerecord novel 0/0 (tagged-only)`.
- `scripts/api-compare/extra-surface-mark.json` has no `activerecord` key, and
  the gate's stranded-row check is shown to fail if one is re-added.
- A deliberately added untagged public name in a Rails-matched activerecord file
  reds the gate with the UNRECEIPTED message — verified locally and stated in
  the PR body, since a gate that cannot be shown to fail is not armed.
- CLAUDE.md, the CI step comment, and the `extra-surface-mark.ts` module comment
  all describe activerecord as tagged-only.
