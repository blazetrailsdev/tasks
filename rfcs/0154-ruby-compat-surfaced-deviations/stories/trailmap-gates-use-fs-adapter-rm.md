---
title: "trailmap-gates-use-fs-adapter-rm"
status: draft
updated: 2026-10-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`FsAdapter` gained an async `rm(path, { recursive, force })` in trails
(`packages/ruby-compat/src/fs-adapter.ts`, story
`fs-adapter-has-no-async-rm-and-leaks-node-fs-callbacks`), backed by
`fsPromises.rm` on the node backend. trailmap's gate scripts were written
before it existed and remove a SQLite database by unlinking the file and its
`-wal`, `-shm` and `-journal` siblings one by one:

- `scripts/equivalence.ts:58`
- `scripts/gate-ringo-lists.ts:120`
- `scripts/gate-ringo-parity.ts`

## Acceptance criteria

- [ ] trailmap vendors a ruby-compat that carries `FsAdapter#rm`
- [ ] the three gate scripts replace the per-suffix `unlink` loop with
      `await getFs().rm(dir, { recursive: true, force: true })` on a
      per-run directory
- [ ] no `*Sync` call is introduced (trailmap's async-fs-only rule)
