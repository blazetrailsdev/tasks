---
title: "hash-config-inspect-omits-ruby-class-path"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
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
closed-reason: null
---

## Context

hash_config_test.rb:178-181 `test_inspect_does_not_show_secrets` expects "#<ActiveRecord::DatabaseConfigurations::HashConfig env_name=default_env name=primary adapter_class=ActiveRecord::ConnectionAdapters::AbstractAdapter>". trails' HashConfig#inspect returns "#<HashConfig env_name=default_env nam…" (short JS class name, same root cause family as quote-error-message-uses-js-constructor-name). Parked as it.skip in packages/activerecord/src/database-configurations/hash-config.test.ts. Not investigated further.

## Acceptance criteria

- inspect renders the Ruby class paths; parked test un-skipped and green.
