---
title: "activerecord: un-exclude legacy_yaml_adapter.rb and coders/yaml_column.rb once Psych lands"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: excluded-files
packages: ["activerecord"]
deps: ["yaml-column-safe-coder-through-psych", "active-record-legacy-yaml-load-tags"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two YAML files are excluded as "Psych is Ruby-only": `legacy_yaml_adapter.rb`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/legacy_yaml_adapter.rb`, `LegacyYamlAdapter.convert` upgrading Rails 4.1/4.2 coder formats) and
`coders/yaml_column.rb`. RFC 0170 ports Psych into ruby-compat and owns the YAML behaviour:
`yaml-column-safe-coder-through-psych`, `active-record-legacy-yaml-load-tags`,
`schema-cache-dump-and-load-through-psych`. What is left here is the measurement: drop the two
exclusions and port whatever `parity:api` then reports.

## Acceptance criteria

- [ ] `LegacyYamlAdapter.convert` is ported with Rails' version arms.
- [ ] Both unported entries are deleted; both files score 100%; `pnpm parity:skips:stories` no longer lists them.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:skips:stories && pnpm parity:api:calls
```
