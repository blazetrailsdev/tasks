---
title: "assume_migrated_upto_version reads version, not a second verNum local"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6366
claim: "2026-08-11T15:43:39Z"
assignee: "naming-burndown-activerecord-rest-3"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `schema-statements.ts` for RFC 0096 in PR #6356.

`schema_statements.rb:1364-1373` writes

```ruby
def assume_migrated_upto_version(version)
  version = version.to_i
  ...
  execute "INSERT INTO #{sm_table} (version) VALUES (#{quote(version)})"
```

— one name, REASSIGNED to the integer.

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`
(`assumeMigratedUptoVersion`) keeps the parameter as `version: number | string`
and introduces a second local `verNum` for the parsed integer, because
reassigning the parameter would leave it typed `number | string` and red the
`v < version` comparisons below. So every use reads `verNum` where Rails reads
`version`, and the `quote(version)` row stays flagged.

## Converged shape

Take the parameter under Rails' name and narrow it to `number` in one step —
e.g. accept `version: number | string` and immediately bind the parsed value to
a `const version: number` in a nested scope, or split the parse into the
signature — so the body reads `version` throughout, as `schema_statements.rb:1365`
onward does.

## Acceptance criteria

1. The body of `assumeMigratedUptoVersion` reads `version`, not `verNum`, at
   every site `schema_statements.rb:1366-1385` reads `version`.
2. No behavior change: the numeric parse (leading-integer, `_` separators) and
   the unquoted numeric literal `quote` emits are unchanged.
3. The `quote(ref:version)` baseline row goes stale and is deleted by hand
   (only-shrink); `pnpm parity:api:calls:args` green.
