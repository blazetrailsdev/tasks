---
title: "ConfigurationFile.parse resolves YAML merge keys by default, as Psych does"
status: draft
updated: 2026-10-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Psych resolves YAML merge keys (`<<: *default`) on every load, and Rails'
`ActiveSupport::ConfigurationFile#parse`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb`)
calls `YAML.unsafe_load(source, **options)` with no merge option. trails'
`ConfigurationFile.parse` (`packages/activesupport/src/configuration-file.ts:37-39`)
calls the backend through ruby-compat's `psych-adapter` `parse`
(`packages/ruby-compat/src/psych-adapter.ts:123-132`), and the npm `yaml` backend
leaves `<<` as an ordinary key unless `{ merge: true }` is passed. So every
caller has to opt in: solid-queue's `Configuration#load_config_from_file`
(`packages/solid-queue/src/configuration.ts`) passes `{ merge: true }`, which
Rails' `configuration.rb:187-193` does not. And
`configuration-file-render.test.ts:83` ("without the option the merge key is
an ordinary key") pins the divergent behaviour.

## Acceptance criteria

- A YAML load through `ConfigurationFile.parse` resolves `<<` merge keys with no option, as Psych does.
- solid-queue's `loadConfigFromFile` calls `ConfigurationFile.parse(file)` with no options.
- The trails test that pins `<<` as an ordinary key is removed or inverted.
