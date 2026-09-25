---
title: "hash-config-inspect-omits-ruby-class-path"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8073
claim: "2026-09-25T00:44:14Z"
assignee: "datetime-attribute-rejects-ruby-datetime-values"
blocked-by: null
closed-reason: null
---

## Context

hash_config_test.rb:178-181 `test_inspect_does_not_show_secrets` expects "#<ActiveRecord::DatabaseConfigurations::HashConfig env_name=default_env name=primary adapter_class=ActiveRecord::ConnectionAdapters::AbstractAdapter>". trails' HashConfig#inspect returns "#<HashConfig env_name=default_env nam…" (short JS class name, same root cause family as quote-error-message-uses-js-constructor-name). Parked as it.skip in packages/activerecord/src/database-configurations/hash-config.test.ts. Not investigated further.

## Acceptance criteria

- inspect renders the Ruby class paths; parked test un-skipped and green.
