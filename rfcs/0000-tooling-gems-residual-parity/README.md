---
rfc: "0000-tooling-gems-residual-parity"
title: "Tooling gems residual parity: rake, zeitwerk, thor and rackup"
status: active
created: 2026-11-09
updated: 2026-11-09
owner: "@deanmarano"
packages:
  - "rake"
  - "zeitwerk"
  - "thor"
  - "rackup"
clusters: []
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Tooling gems residual parity: rake, zeitwerk, thor and rackup

## Summary

Close the residual `parity:api` / `parity:test` gaps the rake, zeitwerk, thor and
rackup ports left after their RFCs (0211, 0213, 0171, 0217) closed.

## Motivation

`pnpm parity:api` / `parity:test` on 2026-11-09 (fresh build):

| Package  | api       | tests                                              |
| -------- | --------- | -------------------------------------------------- |
| rake     | 391 / 465 | 545 / 599, 8 misplaced, 10 skipped (all PERMANENT) |
| zeitwerk | 135 / 147 | 418 / 418, 38 skipped (2 unreceipted)              |
| thor     | 504 / 504 | 791 / 791, 1 skipped (PERMANENT)                   |
| rackup   | 51 / 51   | 63 / 64, 8 skipped (all PERMANENT)                 |

thor is at parity: its one skip is a ratified visibility `PERMANENT-SKIP`, so it
gets no story. rackup's one miss is a helper method the extractor counts as a
test.

## Design

rake: the `FileUtilsExt` helpers first (they credit four other files), then
`clean.rb`, `packagetask.rb`, the pathmap tests and the small remainder.
zeitwerk: `Registry::Inceptions` and the registry readers, then `internal` and
the `Kernel#require` alias, then the two unreceipted skips.

Prior art referenced, not re-filed: `zeitwerk-kernel-require-load-path-feature-arm`
(0154), `zeitwerk-check-name-error-reaches-task-abort` (0123),
`thor-directory-compiled-sibling-test` and the other thor-touching stories in
0142 / 0154, which are about trailties' generators or ruby-compat, not thor's own
parity counts.

## Non-goals

- **Skips already carrying `PERMANENT-SKIP`** with a cited CLAUDE.md section.

## Alternatives considered

- **Scoped-skip `internal` in `conventions.ts` as a visibility macro.** Rejected:
  its `__name` alias is observable, so half of it ports.

## Rollout

1. `rake-file-utils-ext-flags-and-output-helpers`, `zeitwerk-registry-inceptions-and-cref-map-remainder`,
   `rackup-options-server-helper-is-not-a-test`
2. `rake-clean`, `rake-package-task`, `rake-path-map-tests`,
   `rake-extension-private-reader-and-file-list-remainder`,
   `zeitwerk-internal-and-kernel-require-alias`,
   `zeitwerk-eager-loads-gems-and-on-load-survives-reloads`

## Verification

`pnpm parity:api`: rake 465/465, zeitwerk 147/147. `pnpm parity:test`: rake,
zeitwerk, thor and rackup each 100% matched, 0 misplaced, every skip
`PERMANENT-SKIP`.

## Open questions

1. **Does a helper named `test_*` count as a test?** Resolved: no; Minitest
   calls it with no arguments and it would raise, so the extractor skips it.

## Changelog

- 2026-11-09: initial RFC; Open Questions resolved above, so it lands `active`.
