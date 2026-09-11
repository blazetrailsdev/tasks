---
title: "Receipt every activerecord extra and retire its extra-surface mark row"
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
est-loc: 500
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The intent of this story is that activerecord needs **no row** in
`scripts/api-compare/extra-surface-mark.json`: every public extra carries a
`@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>` receipt at its
declaration, so the gate can pin both dimensions at the constant 0 and there is
no shared counter left to track or conflict on.

An earlier attempt (trails#7721) moved activerecord to `TAGGED_ONLY_PACKAGES`
and kept its row. That pins `novel` only. `total` stayed a counted 422:
moved-not-novel extras, names Rails defines in a different `.rb`. The row was
still load-bearing, so novel surface was "tracked" by a number rather than by a
receipt at each declaration. That is not the goal. Also, no `strandedMarks`
check exists today; the gate's `unmarkedPackages` demands a row for every gated
package, and tagged-only mode (see the TAGGED-ONLY MODE module comment in
`scripts/api-compare/extra-surface-mark.ts`) keeps `total` gated by the row.

So the work is:

- receipt (or delete, or relocate to the Rails file that defines it) each of
  activerecord's extras until `pnpm parity:api:extra --package activerecord`
  reports `totalNovel: 0` AND `totalExtras: 0` — receipts already subtract
  from both dimensions in `extra-surface.ts`;
- change the gate so a package pinned in both dimensions needs no mark row:
  pin `total` at 0 as well as `novel`, and exempt such packages from
  `unmarkedPackages`; add a stranded-row check that fails if a row for one of
  them is re-added;
- move `"activerecord"` into that mode, delete its row, and update the module
  comment, the `Extra-surface ratchet` step comment in
  `.github/workflows/ci.yml`, and CLAUDE.md step 4.

At ~422 declarations this exceeds one PR's LOC ceiling. Split the receipts by
directory into sibling stories (the `receipt-*` stories this one depends on are
the template), and keep this story as the final gate change.

## Acceptance criteria

- `pnpm parity:api:extra --package activerecord` reports 0 novel and 0 total
  unreceipted extras.
- `scripts/api-compare/extra-surface-mark.json` has no `activerecord` key, and
  the new stranded-row check is shown to fail if one is re-added.
- A deliberately added untagged public name in a Rails-matched activerecord
  file reds the gate — verified locally and stated in the PR body.
- CLAUDE.md, the CI step comment, and the `extra-surface-mark.ts` module comment
  describe activerecord as pinned with no row.
