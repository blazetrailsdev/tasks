---
title: "activerecord: port ActiveRecord::Marshalling (un-exclude marshalling.rb)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: excluded-files
packages: ["activerecord"]
deps: ["ruby-compat-marshal-core-types"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`marshalling.rb` is excluded: "Ruby's Marshal binary format … No JS equivalent". ruby-compat is growing
Marshal (`ruby-compat-marshal-core-types`, RFC 0154), so the reason no longer holds.
`vendor/rails/v8.0.2/activerecord/lib/active_record/marshalling.rb` defines `Marshalling.format_version` / `format_version=` and the `Methods` module
(`_marshal_dump_7_1`, `marshal_load`) that `format_version = 7.1` includes into `Base`.
`marshal_serialization_test.rb` and the Marshal per-test exclusions are ported by
`activerecord-port-marshal-excluded-tests` in RFC 0175.

## Acceptance criteria

- [ ] `packages/activerecord/src/marshalling.ts` ports the module; `Base` gains `_marshal_dump_7_1` / `marshal_load` through `Methods` when `format_version` is 7.1, as Rails does.
- [ ] The unported entry is deleted and `marshalling.rb` scores 100%.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:skips:stories && pnpm parity:api:calls
```
