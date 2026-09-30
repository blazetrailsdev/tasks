---
title: "DatabaseStatements#with_yaml_fallback through YAML.dump"
status: draft
updated: 2026-09-29
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["activerecord"]
deps:
  ["move-activesupport-yaml-into-ruby-compat-psych", "psych-libyaml-seam-without-top-level-await"]
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

`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:519-525`:
`if value.is_a?(Hash) || value.is_a?(Array) then YAML.dump(value) else value`.
It is called from `build_fixture_sql` (`:621`). trails
(`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:672-678`)
calls npm `stringify(value, { directives: true })`. Reached by `.ts` fixtures
too, so it is the one fixture path that still needs YAML.

## Acceptance criteria

- [ ] `withYamlFallback` calls `YAML.dump(value)`, and the Hash test matches
      Rails' `is_a?(Hash)` (a ruby-compat `Hash` or a plain object).
- [ ] `database-statements.trails.test.ts` stays green.

## Verification

`pnpm vitest run packages/activerecord/src/connection-adapters/abstract/database-statements.trails.test.ts`.
