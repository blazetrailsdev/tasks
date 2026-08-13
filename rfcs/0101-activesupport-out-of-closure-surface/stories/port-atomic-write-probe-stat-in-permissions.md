---
title: "Port File.probe_stat_in and atomic_write's permission copy"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6447
claim: "2026-08-13T00:56:49Z"
assignee: "port-atomic-write-probe-stat-in-permissions"
blocked-by: null
closed-reason: null
---

## Context

`File.atomic_write`
(`vendor/rails/activesupport/lib/active_support/core_ext/file/atomic.rb:20-52`)
copies the destination's permissions onto the temp file before renaming: it
`stat`s the existing file, or probes the directory's defaults through
`probe_stat_in` (`atomic.rb:28-34`, `:55-70`), then `chown`/`chmod`s the temp
file (`atomic.rb:36-46`), swallowing `Errno::EPERM`/`Errno::EACCES`.

The trails port added in PR #6443
(`packages/activesupport/src/core-ext/file/atomic.ts`) omits the whole probe:
the fs adapter models no uid/gid/mode, so a cache file written into a directory
with a non-default umask/setgid ends up with the writing process's default
permissions rather than the destination's. The omission carries
`@missingRailsCall exist?` / `stat` receipts at the call site, and
`probe_stat_in` has no TS counterpart at all.

## Converged shape

Add `statSync`-backed mode/uid/gid to `FsStatResult` (or a dedicated
`chmodSync`/`chownSync` pair) on the fs adapter, then port `probe_stat_in` as
its own function next to `atomicWrite` — Rails keeps it as a separate
`File.probe_stat_in` — and apply the permissions to the temp file before the
rename, rescuing permission errors as Rails does.

## Acceptance criteria

- [ ] `probeStatIn` exists with Rails' decomposition and name.
- [ ] `atomicWrite` copies the destination's mode (and uid/gid where the
      adapter can) onto the temp file, swallowing permission errors.
- [ ] The three `@missingRailsCall` tags on `atomicWrite` are removed.
- [ ] A test writes into a directory with a non-default mode and asserts the
      resulting cache file's mode (must fail on the baseline).
