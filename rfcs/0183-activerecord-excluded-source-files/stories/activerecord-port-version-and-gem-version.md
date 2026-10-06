---
title: "activerecord: un-exclude version.rb — port ActiveRecord.version"
status: done
updated: 2026-10-06
rfc: "0183-activerecord-excluded-source-files"
cluster: excluded-files
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8580
claim: "2026-10-06T14:52:14Z"
assignee: "activerecord-port-encrypted-fixtures-module"
blocked-by: null
closed-reason: null
---

## Context

`version.rb` is one of activerecord's 13 excluded files (`pnpm parity:api` "excluded file 152" defs)
through the unscoped `/version.rb` entry in `scripts/parity/unported-files/unscoped.ts`.
`vendor/rails/v8.0.2/activerecord/lib/active_record/version.rb` is `def self.version; gem_version; end`; `packages/activerecord/src/gem-version.ts`
already exists. `activemodel-port-version-and-gem-version` is the activemodel twin; together they let
the unscoped entry narrow.

## Acceptance criteria

- [ ] `ActiveRecord.version` is ported on the `ActiveRecord` module (`active-record.ts`) returning `gem_version`.
- [ ] The `/version.rb` entry no longer matches activerecord; `parity:api` excluded files 13 → 12.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:skips:stories && pnpm parity:api:calls
```
