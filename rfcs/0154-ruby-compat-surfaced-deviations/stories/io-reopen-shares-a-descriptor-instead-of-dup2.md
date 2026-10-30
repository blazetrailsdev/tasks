---
title: "IO#reopen converges on io_reopen's dup2 and path form"
status: draft
updated: 2026-10-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`IO#reopen` in `packages/ruby-compat/src/io.ts` takes the other IO's descriptor and copies `_pos`, where `io_reopen` dup2s (`vendor/ruby/v3.3.11/io.c:8316-8395`). So the other IO must stay open, the two IOs do not share an offset, and positional writes can overwrite a child's output. The path form (`rb_io_reopen`, `io.c:8446`) is unported, and reopening `STDOUT` leaves the raw process-adapter `stdout` stream unredirected.

## Acceptance criteria

- `$stdout.reopen(f); f.close` keeps writing to the file, and in-process and child writes append in order.
- `reopen(path, mode)` works.
- Writes through the adapter `stdout` / `stderr` follow a reopen of `STDOUT` / `STDERR`.
