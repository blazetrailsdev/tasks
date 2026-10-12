---
title: "Website VFS FsAdapter: unlink reports ENOENT for a bundled template that exists"
status: draft
updated: 2026-10-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The website VFS `FsAdapter` (`packages/website/src/lib/frontiers/vfs-generator.ts`)
serves two bundled, read-only migration templates out of `TEMPLATES`
(`:20-23`); `content`, `existsSync`, `statSync` and `readFile` all see them.

`rm` (added in trails#8831) rejects a template path, or a tree holding one,
with `EROFS` before mutating anything. `unlinkSync` / `unlink` do not: they
call `vfs.delete(path)`, which answers `false` for a path the VFS does not
own, and so raise `ENOENT: unlink` for a file `existsSync` reports as present.
The errno is wrong for the state the backend itself reports, and it is the one
remover left that disagrees with `rm`.

`rmSync` on this backend is a separate gap, tracked by
`vfs-adapter-rmsync-noop-and-no-links`.

## Acceptance criteria

- [ ] `unlinkSync` / `unlink` on a `TEMPLATES` path reject with `EROFS`, as
      `rm` does, and leave the template readable
- [ ] a path that exists nowhere still rejects with `ENOENT`
- [ ] a test in `vfs-generator.test.ts` covers both arms
