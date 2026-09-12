---
title: "Receipt every activerecord extra and retire its extra-surface mark row"
status: blocked
updated: 2026-09-12
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
    "receipt-moved-migration-method-missing-delegations",
    "receipt-moved-base-flattened-module-seats",
    "receipt-moved-adapter-classes-and-pool",
    "receipt-moved-adapter-subtrees-and-oid-types",
    "receipt-moved-associations-and-attribute-methods",
    "receipt-moved-encryption-subtree",
    "receipt-moved-activerecord-remainder",
  ]
deps-rfc: []
est-loc: 220
priority: 3
pr: null
claim: "2026-09-12T00:32:41Z"
assignee: "enrol-activerecord-in-tagged-only-mode"
blocked-by: "Needs total=0, not just novel=0: measured 2026-09-12 novel 0 / moved 396 / total 396 across 125 files. The row gates total, so retiring it requires burning the moved-not-novel population down; tagged-only mode does NOT drop total (extra-surface-mark.ts module comment; RFC 0127 gate-the-wrong-file-moves-population vs PR #7283), so the RFC Non-goal excusing it is stale. Seven area stories filed (receipt-moved-*, 396 names) and added as deps in blazetrailsdev/tasks#116; what remains here is the gate change alone, est-loc 500 -> 220."
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

### The split has been cut; this story is now the gate change alone

Measured 2026-09-12 off a full `pnpm build` + `pnpm parity:api`:
`pnpm parity:api:extra --package activerecord` reports **`novel: 0`, `moved: 396`,
`total: 396`** across 125 files — the five `receipt-*` deps above burnt `novel`
to zero, and none of them touched `moved`. So the 396 that stand between this
story and a deleted row are all moved-not-novel, and they are cut by area into
seven sibling stories, each carrying its own file-and-name census:

| Names | Story                                                |
| ----- | ---------------------------------------------------- |
| 75    | `receipt-moved-associations-and-attribute-methods`   |
| 62    | `receipt-moved-base-flattened-module-seats`          |
| 60    | `receipt-moved-adapter-classes-and-pool`             |
| 59    | `receipt-moved-activerecord-remainder`               |
| 57    | `receipt-moved-adapter-subtrees-and-oid-types`       |
| 51    | `receipt-moved-migration-method-missing-delegations` |
| 32    | `receipt-moved-encryption-subtree`                   |

They are this story's remaining deps. What is left here is the gate change and
nothing else, which is why `est-loc` drops from 500 to 220: pin `total` at the
constant 0 beside `novel` for a package in the new mode, exempt such a package
from `unmarkedPackages`, add the `strandedMarks` check, move `"activerecord"`
across, delete its row, and update the three prose sites.

Note that RFC 0130's Non-goals entry for `total` — "tagged-only mode drops the
moved-not-novel dimension by design" — is **stale**, and this story's premise
supersedes it. The mark's own module comment records the correction ("an earlier
revision of this comment was wrong to claim
`blazetrails/rails-file-structure-method-order` would cover it"), and RFC 0127's
`gate-the-wrong-file-moves-population` documents the same finding against
PR #7283: `parity:api:moves` only reports, and the ordering lint filters its
expected names to those already present in the container, so neither can see a
cross-file relocation. `total` is the only thing gating that population, which
is exactly why retiring the row requires driving it to 0 rather than dropping
the dimension.

## Acceptance criteria

- `pnpm parity:api:extra --package activerecord` reports 0 novel and 0 total
  unreceipted extras.
- `scripts/api-compare/extra-surface-mark.json` has no `activerecord` key, and
  the new stranded-row check is shown to fail if one is re-added.
- A deliberately added untagged public name in a Rails-matched activerecord
  file reds the gate — verified locally and stated in the PR body.
- CLAUDE.md, the CI step comment, and the `extra-surface-mark.ts` module comment
  describe activerecord as pinned with no row.

## Definition of done

Dropping the `total` dimension does **not** close this story, and neither does widening
`unmarkedPackages` to keep the row while calling it retired. The point of the mode is that no
shared counter is left to conflict on, which means the row is deleted and both dimensions are
pinned at the constant 0 — an enrollment that still reads a number from the mark file is the
half-measure trails#7721 already shipped and this story exists to finish.

Un-pinning a package, or moving one back out of the mode, to turn a red run green does not
close it either: enrollment is only-grow, exactly like RFC 0121's.

## Verification

```sh
pnpm build && pnpm parity:api
pnpm parity:api:extra --package activerecord   # totalNovel: 0 AND totalExtras: 0
pnpm parity:api:extra:gate                     # green, `activerecord novel 0/0 total 0/0 (tagged-only)`
pnpm vitest run scripts/api-compare/extra-surface-mark.test.ts
```

Then prove the gate is armed rather than merely quiet, and state both in the PR body:

1. add an untagged public method to a Rails-matched activerecord file and confirm
   `parity:api:extra:gate` goes red on `novel`;
2. re-add an `"activerecord"` key to `scripts/api-compare/extra-surface-mark.json` and
   confirm the new stranded-row check goes red.

## Notes

`unmeasuredPackages` must keep covering activerecord. The row is what `unmarkedPackages`
reads, so exempting the package from THAT check is correct; exempting it from the
measurement-side check as well would disarm the gate the first time a filter hid the package
from the run, which is the exact failure its docstring describes.

The three prose sites to update are the TAGGED-ONLY MODE block in
`scripts/api-compare/extra-surface-mark.ts`, the `Extra-surface ratchet` step comment in
`.github/workflows/ci.yml`, and step 4 of CLAUDE.md's "Before you open the PR". The module
comment's closing paragraph still says activerecord "stays ungated on `novel` until its own
burndown" — that sentence goes with this change.
