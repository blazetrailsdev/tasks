---
title: "converge the two bare-key symbolize_keys callers dropped in trails#7750"
status: closed
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-15T13:16:15Z"
assignee: "symbolize-keys-bare-key-callers-converge"
blocked-by: null
closed-reason: "superseded: user chose bare-keyed option hashes (tasks#125); symbolize_keys omission becomes gate policy via symbolize-keys-optional-in-call-gate"
---

## Context

trails#7750 converged `symbolizeKeys` onto Rails' `key.to_sym rescue key`
(`activesupport/lib/active_support/core_ext/hash/keys.rb:27-29`), so it now yields
`":name"` Symbol-spelled keys. Two callers that Rails routes through
`symbolize_keys` want bare JS property keys, so #7750 replaced the call with a
shallow copy and dropped the Rails call:

- `packages/activerecord/src/database-configurations.ts` `buildDbConfigFromRawConfig`:
  `this.buildDbConfigFromHash(envName, name, { ...config })`. Rails:
  `build_db_config_from_hash(env_name, name, config.symbolize_keys)`
  (`activerecord/lib/active_record/database_configurations.rb:257`).
- `packages/actionview/src/routing-url-for.ts` `urlFor`:
  `const hash = { ...(options as Record<string, unknown>) }`. Rails:
  `options = options.symbolize_keys` (`actionview/lib/action_view/routing_url_for.rb:89`).

`parity:api:calls` does not flag either omission, and a `@missingRailsCall`
receipt at those sites reported STALE, so neither deviation is registered anywhere.

## Converged shape

Each body calls `symbolizeKeys` as Rails does, and the downstream readers
(`HashConfig`'s configuration-hash readers; `ensureOnlyPathOption` and
`ActionDispatch::Routing::UrlFor#url_for`'s option reads) read the Symbol-spelled
keys they receive, exactly as the Ruby readers index with `:adapter` /
`:only_path`. If the reader side cannot move in one PR, the story records which
readers still expect bare keys.

## Acceptance criteria

- `buildDbConfigFromRawConfig` and `RoutingUrlFor#urlFor` call `symbolizeKeys`.
- The readers of the resulting hashes are converged to the Symbol spelling; database-configurations and routing-url-for suites stay green.
- `pnpm parity:api:calls` / `:calls:args` gain no rows.
