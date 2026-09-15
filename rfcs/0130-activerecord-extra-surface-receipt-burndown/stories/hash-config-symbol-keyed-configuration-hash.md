---
title: "hash-config-symbol-keyed-configuration-hash"
status: closed
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by tasks#125 (bare-keyed decision)"
---

## Context

Rails stores a db config's hash Symbol-keyed: `HashConfig#initialize` does
`@configuration_hash = configuration_hash.symbolize_keys.freeze`
(`activerecord/lib/active_record/database_configurations/hash_config.rb`), and
`DatabaseConfigurations#build_db_config_from_raw_config` passes `config.symbolize_keys`
(`database_configurations.rb:257`). Every reader indexes `:adapter`, `:database`, `:host`, ...

trails' `symbolizeKeys` now yields `":name"` keys (trails#7750), but `HashConfig`,
`UrlConfig`, `ConnectionUrlResolver`, and every adapter constructor read bare keys
(`configurationHash.adapter`, `config.database`): 18 non-test src files, ~91 test reads.
Until they read `":adapter"` etc., `buildDbConfigFromRawConfig`
(`packages/activerecord/src/database-configurations.ts:250`) cannot call `symbolizeKeys`.

## Acceptance criteria

- `HashConfig` stores and its readers read Symbol-spelled (`":adapter"`) keys, as `hash_config.rb` does.
- Adapter / pool / resolver readers of `configurationHash` converge to the same spelling.
- Unblocks `symbolize-keys-bare-key-callers-converge`'s database-configurations half.
