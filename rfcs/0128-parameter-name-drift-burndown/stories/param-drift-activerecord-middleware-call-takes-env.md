---
title: "param-drift-activerecord-middleware-call-takes-env"
status: in-progress
updated: 2026-08-31
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 5
pr: 7278
claim: "2026-08-31T00:08:11Z"
assignee: "param-drift-activerecord-final-four-residual-rows"
blocked-by: null
closed-reason: null
---

## Context

The last two parameter-name rows from
`param-drift-activerecord-remainder-residual-four` (PR #7221 converged the
`AutoFilteredParameters` row; the cipher row is
`param-drift-activerecord-aes256-gcm-generate-iv-cipher`):

```text
  middleware/database_selector.rb#call  @0  `env` → `request`
  middleware/shard_selector.rb#call     @0  `env` → `request`
```

`DatabaseSelector#call(env)`
(`vendor/rails/activerecord/lib/active_record/middleware/database_selector.rb:60-64`)
and `ShardSelector#call(env)`
(`vendor/rails/activerecord/lib/active_record/middleware/shard_selector.rb:62-70`)
both take the Rack `env` and build `request = ActionDispatch::Request.new(env)`
as their first statement. Ruby resolves `ActionDispatch::Request` at call time
via Zeitwerk, so activerecord names it without taking a load-time dependency —
`activerecord.gemspec` does not declare actionpack.

The ports are handed the request directly (`shard-selector.ts:38` already
carries the JSDoc for it): an ESM `import` of `ActionDispatch::Request` into
activerecord would be an eager, hard cross-package dependency Rails does not
have. This is convergeable with RFC 0106 (call-time constant resolution) — the
zero-import slot idiom in CLAUDE.md — and not before.

## Acceptance criteria

- Both rows are gone from
  `scripts/api-compare/output/param-name-mismatches.json` for
  `--package activerecord`.
- Both `call` methods take `env` and construct the request themselves, mirroring
  `database_selector.rb:61` / `shard_selector.rb:63`, with the
  `ActionDispatch::Request` constructor reached through the RFC 0106 call-time
  resolution mechanism — not a top-level `import` from activerecord into
  actionpack.
- The `@noRailsEquivalent` / deviation JSDoc on `shard-selector.ts:38` is
  retired with the deviation.
- No behaviour change; every existing middleware test passes unchanged apart
  from being handed an `env`.
