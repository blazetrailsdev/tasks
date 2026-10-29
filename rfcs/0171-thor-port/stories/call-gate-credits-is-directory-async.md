---
title: "Call gate credits File.isDirectoryAsync for directory?"
status: draft
updated: 2026-10-29
rfc: "0171-thor-port"
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

`Thor::Actions::Directory#execute!` (`vendor/thor/v1.3.2/lib/thor/actions/directory.rb:82`) calls
`File.directory?(file_source)`; its port (`packages/thor/src/actions/directory.ts` `executeBang`)
spells it `File.isDirectoryAsync` (ruby-compat's async twin, `packages/ruby-compat/src/file.ts`),
since Thor actions use async fs only. `pnpm parity:api:calls` accepts only
`isDirectory|directory|_isDirectory|_directory` for `directory?`, so the site carries a
`@missingRailsCall directory? — CONVERGEABLE` receipt. The `File.exist?` sites on
`File.isExistAsync` are not flagged, so the gate already has some path that credits one async twin.

## Acceptance criteria

- [ ] The call gate credits ruby-compat's `*Async` twin of a ported predicate (`isDirectoryAsync`
      for `directory?`) as it credits `isExistAsync` for `exist?`.
- [ ] The `@missingRailsCall directory?` receipt on `Directory#executeBang` is deleted.
