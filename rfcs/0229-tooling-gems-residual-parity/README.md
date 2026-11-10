---
rfc: "0229-tooling-gems-residual-parity"
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

# RFC 0229 — Tooling gems residual parity: rake, zeitwerk, thor and rackup

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

Each target count is closed by named stories.

rake's 74 missing api rows:

- `rake-file-utils-ext-flags-and-output-helpers` closes 29 (nine in
  `file_utils_ext.rb`, plus five names × four includers). They already exist,
  so it closes them by confirming the credit fix, as does `PrivateReader`'s one.
- `rake-clean` closes 4.
- `rake-package-task-accessors-and-tests` and `rake-package-task-define-archives`
  close `packagetask.rb`'s 36.
- `rake-extension-private-reader-and-file-list-remainder` closes the other
  4 (`rake_extension`, `to_s`, and the two moved `Rake` functions).

zeitwerk's 12:

- `zeitwerk-registry-inceptions-and-cref-map-remainder` closes 5:
  `Inceptions#unregister`, `Registry.loaders`, `.autoloads`, `Loader#inceptions`
  and `Cref::Map#initialize`.
- `zeitwerk-internal-and-kernel-require-alias` closes 7: `Internal#internal`, its
  four includer rows and the two `Kernel` aliases.

rackup's one miss is a helper Minitest also runs as a test, so it is ported as one. thor needs no story: api 504/504, tests
791/791, and its one skip is a visibility `PERMANENT-SKIP`.

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
- **thor-adjacent stories in RFCs `0142-trailties-surfaced-deviations` and
  `0154-ruby-compat-surfaced-deviations`** (`thor-directory-compiled-sibling-test`,
  `generator-base-tags-thor-actions-initialize`,
  `ruby-compat-generic-include-for-thor-enum-check`,
  `thor-terminal-dynamic-width-needs-backtick-with-inherited-stdin`): they fix
  trailties' generators or ruby-compat helpers, and none moves thor's own counts.
- **`zeitwerk-kernel-require-load-path-feature-arm`** (0154): an arm inside the
  patched `require`, not a missing member.

## Alternatives considered

- **Scoped-skip `internal` in `conventions.ts` as a visibility macro.** Rejected:
  its `__name` alias is observable, so half of it ports.

## Rollout

Many "missing" rows here are members of object-literal modules
(`FileUtilsExt`, `Registry`, `PrivateReader::ClassMethods`) that the extractor
does not credit. One generic fix, `mail-parity-api-credits-object-literal-modules`
in the mail-stack RFC, closes them for every package, and the rake and zeitwerk
stories that rely on it name it in their Context. The `deps` edge is added with
`tasks set-deps` once the mail-stack RFC merges, because `validate` refuses a
dep on a story that is not ingested yet.

The only ordering is the `deps`: the `FileUtilsExt` story before both
package-task stories, and accessors before archives. Everything else, in both
phases, can run in parallel.

1. `rake-file-utils-ext-flags-and-output-helpers`, `zeitwerk-registry-inceptions-and-cref-map-remainder`,
   `rackup-options-server-runs-as-a-test`
2. `rake-clean`, `rake-package-task-accessors-and-tests`,
   `rake-package-task-define-archives`, `rake-guarded-tests-and-thread-history-path`, `rake-path-map-tests`,
   `rake-extension-private-reader-and-file-list-remainder`,
   `zeitwerk-internal-and-kernel-require-alias`,
   `zeitwerk-eager-loads-gems-and-on-load-survives-reloads`

## Verification

`pnpm parity:api`: rake 465/465, zeitwerk 147/147. `pnpm parity:test`: rake,
zeitwerk, thor and rackup each 100% matched, 0 misplaced, every skip
`PERMANENT-SKIP`.

## Open questions

1. **Is rackup's `test_options_server` a test?** Resolved: yes. It takes only
   a splat, so Minitest runs it with no arguments; it is ported as that test
   and the extractor is unchanged.

## Changelog

- 2026-11-09: initial RFC; Open Questions resolved above, so it lands `active`.
- 2026-11-09: revised for review feedback.
