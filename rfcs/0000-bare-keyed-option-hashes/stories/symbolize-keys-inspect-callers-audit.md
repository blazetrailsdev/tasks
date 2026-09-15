---
title: "audit the 5 trails symbolizeKeys call sites against Rails; keep only where Symbol-ness is observable"
status: ready
updated: 2026-09-15
rfc: "0000-bare-keyed-option-hashes"
cluster: symbolize-keys-policy
packages: [actionview, activerecord]
deps: [symbolize-keys-optional-in-call-gate]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails calls `symbolizeKeys` outside its definitions (`activesupport/src/hash-utils.ts`,
`hash-with-indifferent-access.ts`) at:

- `packages/actionview/src/template/error.ts:105`: `MissingTemplate` message, `rbInspect(symbolizeKeys(details))`.
- `packages/activerecord/src/migration.ts:1208`: `formatArguments`, `rbInspect` of the filtered options.
- `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1672,1745`: "has no foreign key / check constraint for" messages.
- `packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts:899,1023`: "has no exclusion / unique constraint for" messages.

All five feed `rbInspect`, which is observable rule 1 in the RFC Design. Most Rails bodies have no `symbolize_keys`
there (`action_view/template/error.rb`, `migration.rb#format_arguments`), because a Ruby kwargs hash is already
Symbol-keyed. The nearest Rails call, `abstract/schema_statements.rb:1631` (`options_for_index_columns`), is an index-options
normalization, not one of these messages. So the trails call stands in for the key type rather than a Rails call.

## Acceptance criteria

- For each site, compare the rendered message with Rails' string (`{column: "x"}` vs `{"column" => "x"}`). Keep the call if the output needs `":name"` keys, otherwise remove it.
- Each kept site has a test asserting the exact Rails message (use the Rails test when one exists; otherwise add a `.trails.test.ts` case).
- Record each site's verdict (rule 1/2/3 or removed) in the PR body.
