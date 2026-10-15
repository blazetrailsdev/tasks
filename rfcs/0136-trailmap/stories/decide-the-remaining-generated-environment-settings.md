---
title: "trailmap: adopt or decline the rest of the generated environment settings"
status: in-progress
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trailmap#70
claim: "2026-10-15T18:45:11Z"
assignee: "trails-tsc-names-a-model-whose-table-no-schema-has"
blocked-by: null
closed-reason: null
---

## Context

trailmap#66 put `config/environments/*.ts` in the `configure` shape, which made
them take effect, and carried only the settings the old inert files named. The
rest of `trails new`'s output is named in comments there as not adopted:

- development: the `tmp/caching-dev.txt` toggle, `raiseOnMissingCallbackActions`,
  `annotateRenderedViewWithFilenames`, the Active Record query-log settings.
- test: `publicFileServer.headers`, `raiseOnMissingCallbackActions`,
  `activeSupport.deprecation = "stderr"`.
- production: `logTags`, `publicFileServer.headers`, `i18n.fallbacks`,
  `activeRecord.dumpSchemaAfterMigration`, `attributesForInspect`.

`forceSsl` / `assumeSsl` stay false: the loopback API is plain HTTP.

## Acceptance criteria

- [ ] Each setting above is either adopted, with the suite and `smoke-boot.sh` green, or has a one-line reason in the file.
