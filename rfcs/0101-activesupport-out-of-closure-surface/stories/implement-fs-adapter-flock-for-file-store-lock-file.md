---
title: "Give the Node fs adapter a real flockSync so FileStore#lockFile locks"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6448
claim: "2026-08-13T00:36:51Z"
assignee: "implement-fs-adapter-flock-for-file-store-lock-file"
blocked-by: null
closed-reason: null
---

## Context

`FileStore#lock_file` (`vendor/rails/activesupport/lib/active_support/cache/file_store.rb:140-153`)
opens the entry `r+`, takes `File::LOCK_EX`, yields, and releases in an
`ensure`, so two processes cannot interleave the read-modify-write in
`modify_value` (`file_store.rb:228`).

PR #6443 ported the control flow into
`packages/activesupport/src/cache/file-store.ts` (`lockFile`) and wrapped
`modifyValue` in it, but the lock itself is a no-op on the Node adapter: Node's
`fs` exposes no `flock(2)`, so `FsAdapter.flockSync` was added as an OPTIONAL
member (`packages/activesupport/src/fs-adapter.ts`) and the Node registration
omits it. The file is opened and closed, the block runs unlocked, and
concurrent `increment`s can still lose an update — the exact bug `lock_file`
exists to prevent.

## Converged shape

Give the Node fs adapter a real `flockSync(fd, "ex" | "un")`. Options, in
preference order:

1. A `worker_threads`/`Atomics`-based in-process lock plus an on-disk lockfile
   (`open(path + ".lock", "wx")` with retry) for cross-process exclusion — no
   native dependency, and the retry loop is the same shape `File#flock`
   blocking gives us.
2. `fs.constants` + a native binding if one ever lands in Node.

Whatever the mechanism, `lockFile` itself should not change: it already
mirrors the Ruby.

## Acceptance criteria

- [ ] The Node fs adapter implements `flockSync`, and `lockFile` takes a real
      exclusive lock.
- [ ] A regression test shows two concurrent `increment("counter")` calls
      through separate FileStore instances on the same cache path summing to 2
      (it must fail on the baseline).
- [ ] `flockSync` stays optional on the `FsAdapter` interface so custom
      adapters need not implement it.
