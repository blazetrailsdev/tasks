---
title: "Website VFS FsAdapter: rmSync is a no-op and symlink/link are absent"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8318, which put the website VFS adapter's sync and async verbs on one
directory model (`packages/website/src/lib/frontiers/vfs-generator.ts`). Two gaps remain against
the `FsAdapter` contract (`packages/ruby-compat/src/fs-adapter.ts`):

1. `rmSync` is a no-op (`vfs-generator.ts`, `rmSync(): void { /* no-op */ }`). Nothing in
   ruby-compat or trailties' generators calls it today (sync `FileUtils` removal goes through
   `unlinkSync` / `rmdirSync`), but it silently removes nothing where node's removes the tree.
2. `symlink` / `link` are absent, so `File.symlinkAsync` / `File.linkAsync` raise
   `NotImplementedError` and Thor's `create_link`
   (`vendor/thor/v1.3.2/lib/thor/actions/create_link.rb:40-54`) cannot run in the browser.
   `VirtualFS` (`virtual-fs.ts`) stores `path` / `content` / `language` only, so a link needs a
   column or a marker row.

## Acceptance criteria

- [ ] `rmSync(path, { recursive, force })` removes the file, or the directory and everything
      beneath it, with node's `ENOENT` / `EISDIR` rules, sharing the model the other verbs use.
- [ ] Decide `symlink` / `link`: either `VirtualFS` stores a link target and `lstat` /
      `readFile` / `isSymbolicLink` honour it, or the story is closed stating that browser
      generators never create links.
- [ ] `vfs-generator.test.ts` covers each.
