---
title: "tempfile-open-leaves-file-without-finalizer"
status: in-progress
updated: 2026-11-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9671
claim: "2026-11-03T14:57:46Z"
assignee: "class-paths-table-covers-rails-command"
blocked-by: null
closed-reason: null
---

## Context

`Tempfile.open` with a block only closes the file (`vendor/ruby/v3.3.11/lib/tempfile.rb`); MRI removes it through the finalizer at GC or exit. `packages/ruby-compat/src/tempfile.ts` `Tempfile.open` also only closes, and JS has no such finalizer, so `Thor::Shell::Basic#show_diff` and `#merge` (`packages/thor/src/shell/basic.ts`) leave a `<basename>YYYYMMDD-pid-rand` file beside the destination on every diff or merge. `packages/thor/src/shell/basic.test.ts` deletes them in an `afterEach` for this reason.

## Acceptance criteria

- A Tempfile created in a process is removed by process exit at the latest, as MRI's finalizer does.
- The `afterEach` cleanup in `basic.test.ts` is deleted, and the file_collision cases leave no file behind.
