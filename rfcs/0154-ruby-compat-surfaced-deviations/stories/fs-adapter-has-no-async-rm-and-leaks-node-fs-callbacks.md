---
title: "ruby-compat: FsAdapter has no async rm, and the node backend exposes node:fs's callback rm under that name"
status: in-progress
updated: 2026-10-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: trails#8831
claim: "2026-10-12T19:42:24Z"
assignee: "fs-adapter-has-no-async-rm-and-leaks-node-fs-callbacks"
blocked-by: null
closed-reason: null
---

## Context

Found building trailmap#69 (`scripts/gate-ringo-parity.ts`). A script that must
use async fs only (trailmap's rule: no `*Sync`) reached for
`await getFs().rm(dir, { recursive: true, force: true })` and died with:

```text
node:internal/fs/rimraf:51
    callback(err);
TypeError: callback is not a function
```

Two things in `packages/ruby-compat/src/fs-adapter.ts` (trails `origin/main`)
combine to produce that:

- **There is no async recursive remove.** `FsAdapter` declares `rmSync(path,
{ recursive, force })` at `:60`, and the optional async verbs at `:100-112`
  stop at `unlink?` (`:105`) and `rmdir?` (`:109`). An async caller has no way
  to remove a tree; trailmap's gates unlink a database file and its `-wal`,
  `-shm` and `-journal` siblings one by one instead
  (`scripts/equivalence.ts:58`, `scripts/gate-ringo-lists.ts:120`,
  `scripts/gate-ringo-parity.ts`).
- **The node backend leaks `node:fs`'s callback API under the same names.**
  `tryAutoRegisterNode` builds the adapter as `Object.assign({}, nodeFs, {...})`
  (`:268`), so every `node:fs` export the overrides do not replace is on the
  object at runtime: `fs.rm`, `fs.copyFile`, `fs.appendFile`, `fs.access` are
  all node's CALLBACK functions. The type hides them, so `tsc` refuses the
  call — but `tsx`, plain JS and an `as any` do not, and the failure is an
  uncaught exception from inside node rather than a message naming the adapter.

## Expected shape

- `rm?(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>`
  on `FsAdapter`, backed by `fsPromises.rm` on node and by the VFS backend
  (see `vfs-adapter-rmsync-noop-and-no-links` for that backend's sync gap).
- The node backend built from a named list of the verbs the contract declares,
  not a spread of the module, so a verb the contract does not have is
  `undefined` on every backend and fails the same way everywhere.

## Acceptance criteria

- [ ] `await getFs().rm(dir, { recursive: true, force: true })` removes a tree
      on the node backend, with a test in `fs-adapter.test.ts`
- [ ] the node adapter exposes no callback-style `node:fs` function; a test
      enumerates the adapter's keys against the `FsAdapter` contract
- [ ] trailmap's three gate scripts drop the per-suffix `unlink` loop for `rm`
      once the fix is vendored (a trailmap follow-up, cited here)
