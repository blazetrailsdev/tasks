---
title: "Converge Thor actions' File.exist? sites onto File.isExistAsync"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8521 added `File.isExistAsync` to ruby-compat (`packages/ruby-compat/src/file.ts`, the async
twin of `File.exist?`, `vendor/ruby/v3.3.11/file.c:1806`) and `Thor::Actions#remove_file` uses it.
Three earlier Thor ports still spell `File.exist?` as a bare adapter call, `getFs().exists(...)`:

- `packages/trailties/src/thor/actions.ts` `findInSourcePaths`: `File.exist?(source_file)`
  (`vendor/thor/v1.3.2/lib/thor/actions.rb:140`).
- `packages/trailties/src/thor/actions.ts` `inside`: `!File.exist?(destination_root)`
  (`vendor/thor/v1.3.2/lib/thor/actions.rb:179`).
- `packages/trailties/src/thor/actions/empty-directory.ts` `isExists`: `::File.exist?(destination)`
  (`vendor/thor/v1.3.2/lib/thor/actions/empty_directory.rb:46`).

## Acceptance criteria

- [ ] Each of the three sites calls `File.isExistAsync(path)`, the Ruby name, and no Thor action
      body calls `getFs().exists` for a `File.exist?`.
- [ ] `getFs` is dropped from an import list it no longer serves.
- [ ] `pnpm parity:api:calls` and the existing `actions` / `create-file` tests stay green.
