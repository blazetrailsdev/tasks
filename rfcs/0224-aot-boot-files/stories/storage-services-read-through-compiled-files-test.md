---
title: "active_storage.services reads config/storage.ts through the compiled-file map: test"
status: draft
updated: 2026-11-09
rfc: "0224-aot-boot-files"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9911 moved `active_storage.services` (`packages/activestorage/lib/engine.ts:224-228`,
mirroring `vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb` `initializer "active_storage.services"`)
onto `loadIseqEval`, so `config/storage.ts` reads through the compiled-file map.
`packages/trailties/test/boot-sites-compiled-files.trails.test.ts` covers the database
config and `configFor` read through a registered thunk; the storage read has no such test.

## Acceptance criteria

- An activestorage `.trails.test.ts` registers `config/storage.ts` through
  `registerCompiledFiles`, writes a disk file that throws, runs the
  `active_storage.services` initializer, and asserts the thunk was read and the
  service configurations come from it.
