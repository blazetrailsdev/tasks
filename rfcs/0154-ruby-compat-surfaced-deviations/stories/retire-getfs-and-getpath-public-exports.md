---
title: "Retire getFs/getPath from ruby-compat's public exports onto File/Dir"
status: blocked
updated: 2026-11-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#10736
claim: "2026-11-25T13:29:41Z"
assignee: "adopt-rbobjdup-rbobjclone-at-remaining-copy-sites"
blocked-by: "remaining callers and export removal: trailties-reaches-fs-through-file-and-dir, thor-zeitwerk-tsc-vite-reach-fs-through-file-and-dir, retire-getfs-getpath-test-callers-and-exports"
closed-reason: null
---

## Context

`unexempt-file-and-dir-from-core-class-receivers` (RFC 0135) is done
(trails#7462). One of its acceptance criteria was: "`getFs()` and `getPath()`
are deleted from ruby-compat's public exports". They are still exported from
`packages/ruby-compat/src/fs-adapter.ts`, and both still carry
`@noRailsEquivalent CONVERGEABLE unexempt-file-and-dir-from-core-class-receivers`.
Surfaced by trails#8004 and re-pointed here by
`retire-convergeable-receipts-citing-done-stories`.

About 45 files still call them. The non-test callers include
`actionpack/.../routing/mapper.ts:612`,
`actionpack/.../system-testing/test-helpers/screenshot-helper.ts:112,122`,
`activesupport/src/encrypted-file.ts:93-194`,
`activerecord/src/tasks/database-tasks.ts:659`,
`activerecord/src/type-virtualization/auto-import.ts:95` and
`ruby-compat/src/dir.ts:23,95`. Rails spells each of these through `File` /
`Dir` / `FileUtils`.

## Acceptance criteria

- Every caller reaches the filesystem through ruby-compat's `File` / `Dir`
  (the Ruby receiver its Rails line uses), and `getFs` / `getPath` leave the
  public exports with their receipts. The `FsAdapter` / `PathAdapter` types
  stay for backends.
- Split by package if the LOC ceiling needs it.
