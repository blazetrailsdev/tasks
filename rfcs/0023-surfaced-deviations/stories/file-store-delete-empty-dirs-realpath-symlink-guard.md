---
title: "FileStore.deleteEmptyDirectories: use realpath (not lexical resolve) for cacheDir guard to match Rails File.realpath"
status: in-progress
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 4094
claim: "2026-06-25T01:42:34Z"
assignee: "file-store-delete-empty-dirs-realpath-symlink-guard"
blocked-by: null
---

## Context

`FileStore.deleteEmptyDirectories` (`packages/activesupport/src/cache/file-store.ts`)
guards the recursion stop-condition with `getPath().resolve(dir) === getPath().resolve(this.cacheDir)`.
Rails `delete_empty_directories` (`file_store.rb:195`) uses
`File.realpath(dir) == File.realpath(cache_path)`, which resolves symlinks;
`path.resolve` only normalizes lexically.

If `cacheDir` or an intermediate directory is reached via a symlink, the
lexical guard can mis-compare — stopping short, or (in principle) recursing
past `cacheDir`. The recursion is independently bounded by the empty-children
check so it cannot rmdir a non-empty tree, making this low-risk, but it is a
genuine divergence from Rails surfaced in PR #4000 review.

The blocker is that the fs-adapter exposes only an **async** `realpath`
(`fs-adapter.ts:81`) and no `realpathSync`, while the entire `FileStore` delete
path is synchronous. Converging exactly requires either adding `realpathSync`
to the fs-adapter interface (+ all adapter impls) or making the delete path
async.

## Acceptance criteria

- `deleteEmptyDirectories` resolves symlinks for the cacheDir guard, mirroring
  Rails `File.realpath` semantics.
- fs-adapter gains a sync `realpathSync` (or the delete path is made async),
  with all registered adapters implementing it.
- A test covering a symlinked cacheDir / intermediate dir confirms the guard
  stops at the real cacheDir.
- api:compare / test:compare delta non-negative.
