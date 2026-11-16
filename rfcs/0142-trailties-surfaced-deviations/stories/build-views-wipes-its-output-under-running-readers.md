---
title: "build-views removes the whole compiled views directory before rebuilding, under any process still reading it"
status: draft
updated: 2026-11-16
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trails-tsc/lib/build-views.ts:209` starts every build with
`await fs.rm(outViews, { recursive: true, force: true })`, then recompiles into
the same `.trails/views` directory (`build-views.ts:11`, `:19`). Anything still
reading that directory loses its files mid-read.

Found on trailmap#145 (vendored pin `a7270c9593c9`), three times in one session:

- `pnpm views` run while `bin/trails server` was up killed the server with
  `ENOENT ... syscall: 'rmdir', path: '.trails/views/shared'`.
- `trails-tsc` (`pnpm build`) run while a server was booting failed with
  `ENOENT: no such file or directory, open '.trails/views/audits/index.html.tse.js.map'`.
- A vitest run overlapping a server boot read half-built view output.

Rails has no equivalent: templates compile in memory per process, so one
process rebuilding never takes files away from another. The shape expected
here is a build that other processes can keep reading through: compile into a
sibling temporary directory and rename it into place, or overwrite file by
file and remove only outputs whose source is gone (the per-view removal at
`build-views.ts:172-177` already does that for a single view).

Related, already filed and not this story:
`precompiled-views-bake-the-build-environments-annotation`.

## Acceptance criteria

- A build never leaves `.trails/views` missing or partly empty while it runs:
  a reader that opens a compiled view during a rebuild gets the old file or the
  new one, never ENOENT.
- A test runs a build while another process reads the output directory in a
  loop and asserts no read fails.
- `trails server` survives a concurrent `trails-tsc-views build` of the same
  application.
