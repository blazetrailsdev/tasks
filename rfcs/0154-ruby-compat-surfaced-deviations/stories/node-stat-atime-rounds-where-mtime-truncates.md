---
title: "The node fs backend still rounds File::Stat#atime up where mtime now truncates"
status: draft
updated: 2026-10-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8830 made the node fs backend build `mtime` with `Math.trunc(mtimeMs)`
at every stat entry point (`withExecutable` in
`packages/ruby-compat/src/fs-adapter.ts`, wired to `statSync`, `fstatSync`,
`lstatSync`, async `stat` and `lstat`), because node builds `Stats#mtime` with
`Math.round(mtimeMs)` and a just-written file could read as later than a
`new Date()` taken after the write. That reddened
`packages/trailties/src/boot-app-reload.trails.test.ts` on main through
`ActiveSupport::FileUpdateChecker#max_mtime`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/file_update_checker.rb:118-134`).

`atime` was left alone. `FsStatResult#atime` is still node's rounded
`Stats#atime`, so one stat result now carries a truncated `mtime` beside a
rounded `atime`. Ruby keeps both at full signed subsecond precision through the
same conversion (`stat_atime` / `stat_mtime`,
`vendor/ruby/v3.3.11/file.c:907-927`, `:997-999`). The one consumer of both is
`FileUtils` `copy_metadata` (`packages/ruby-compat/src/file-utils.ts`,
`fileUtime(st.atime, st.mtime, path)`), which hands a destination an atime that
can be 1 ms later than the source's.

## Acceptance criteria

- The node backend converts `atime` with the same `Math.trunc(atimeMs)` as
  `mtime`, at all five stat entry points.
- A `file.trails.test.ts` case sets a sub-millisecond atime on both sides of
  the epoch (`utimesSync(path, "-0.0007", …)` sets a negative fractional time
  through node) and asserts the truncated value through each entry point; it
  fails on the baseline.
- No new public name, no code comment in the diff.
