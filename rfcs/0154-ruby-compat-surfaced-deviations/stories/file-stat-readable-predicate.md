---
title: "File::Stat#readable? on FsStatResult; Rack::Directory#list_path reads it"
status: draft
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack's `Directory#list_path` is `if (stat = stat(path)) && stat.readable?`
(`vendor/rack/v3.1.14/lib/rack/directory.rb:172`), which is `File::Stat#readable?`
(`vendor/ruby/v3.3.11/file.c` `rb_stat_r`: true for root, else the owner, group
or other read bit that applies to the effective uid/gid). ruby-compat's
`FsStatResult` (`packages/ruby-compat/src/fs-adapter.ts:15`) has `isExecutable`
but no `isReadable`. So `packages/rack/src/directory.ts` `listPath` calls
`File.isReadable(path)`, a second `eaccess` on the path, where Rails asks the stat
it already has.

## Acceptance criteria

- [ ] `FsStatResult` gains `isReadable()`, implemented as `rb_stat_r` in the node
      backend (`withExecutable` in fs-adapter.ts) and in every other backend
      (`packages/website/src/lib/frontiers/vfs-generator.ts`).
- [ ] `Directory#listPath` reads `stat.isReadable()`, as Rails does.
