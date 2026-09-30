---
title: "activerecord: verify and pin the 17 migration/compatibility.rb pairs"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: pins
packages: ["activerecord"]
deps:
  [
    "compatibility-module-members-unmeasured-by-parity-api",
    "port-remaining-migration-compatibility-test-cases",
  ]
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

The other 17 unpinned activerecord pairs are `migration/compatibility.rb` members
(`add_column`, `add_foreign_key`, `add_index`, `add_reference`, `add_timestamps`, `change_column`,
`change_column_null`, `command_recorder`, `compatible_table_definition`, `create_join_table`,
`create_table`, `disable_extension`, `find`, `index_exists?`, `index_name_for_remove`, `remove_index`,
`rename_table`), matched when trails#8206 lifted the file's exclusion. The 18 module members
`compatibility-module-members-unmeasured-by-parity-api` (RFC 0155) brings in will need pinning too.

## Acceptance criteria

- [ ] All `compatibility.rb` pairs verified and pinned; activerecord pins **100%** once `activerecord-verify-and-pin-protocol-bodies` also lands.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins
```
