---
title: "Drop the invented numeric-version guard from assumeMigratedUptoVersion"
status: done
updated: 2026-07-31
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5768
claim: "2026-07-31T23:00:40Z"
assignee: "assume-migrated-upto-version-drop-invented-numeric-guard"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#assumeMigratedUptoVersion`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1835`)
opens with a trails-invented guard:

```ts
const ver = String(version);
if (!/^\d+$/.test(ver)) {
  throw new Error(`Invalid migration version: ${version}`);
}
const verNum = parseInt(ver, 10);
```

Rails does no validation at all — `abstract/schema_statements.rb:1365` is just
`version = version.to_i`, so a non-numeric argument coerces to `0` and the
method proceeds (inserting version 0, selecting nothing below it) rather than
raising. trails raises instead, which is observable to any caller passing a
non-numeric value.

Surfaced while deduping the two `assumeMigratedUptoVersion` implementations
(PR #5761); the deleted `SchemaMigration` copy carried a stricter version of
the same invented validation.

## Acceptance criteria

- [ ] Replace the regex guard + throw with Rails' `to_i` semantics (a JS
      analogue of `String#to_i`: leading-integer parse, `0` on no match).
- [ ] Cover the non-numeric-input path with a test matching Rails behaviour
      (target version becomes 0, no raise).
- [ ] parity:api / parity:test delta non-negative.
