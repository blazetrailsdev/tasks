---
title: "rake-file-list-prerequisite-sync-read"
status: done
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9532
claim: "2026-10-31T14:36:51Z"
assignee: "rake-file-list-prerequisite-sync-read"
blocked-by: null
closed-reason: null
---

## Context

`Task.format_deps` reads a `FileList` through `to_ary` synchronously (`vendor/rake/v13.2.1/lib/rake/task.rb:372-375`). `FileList#toAry` globs asynchronously, so `packages/rake/src/task.ts` `_resolvePrerequisites` defers it to the first awaited read, and the sync `prerequisites` getter reads a pending list as empty.

## Acceptance criteria

- [ ] A read of `prerequisites` right after `define_task` answers the `FileList`'s entries, or the limit is ruled on by the repo owner.
- [ ] The `_resolvePrerequisites` receipt is deleted.
