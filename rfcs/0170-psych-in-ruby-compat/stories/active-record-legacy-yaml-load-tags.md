---
title: "Register ActiveRecord's legacy YAML load_tags (active_record.rb:570-573)"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["activerecord"]
deps: ["psych-load-tags-dump-tags-and-domain-types"]
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

`vendor/rails/v8.0.2/activerecord/lib/active_record.rb:570-573` maps
`!ruby/object:ActiveRecord::AttributeSet`, `::Attribute::FromDatabase`,
`::LazyAttributeHash` and `::ConnectionAdapters::AbstractMysqlAdapter::MysqlString`
to their current classes. `yaml_serialization_test.rb`'s
`test_deserializing_rails_v1_mysql_yaml` / `rails_4_2_0_yaml` need them. The
line was mentioned in `psych-scalar-and-tag-visitors` and moved here.

## Acceptance criteria

- [ ] `active-record.ts` writes the four `Psych.loadTags` entries at module
      load, in Rails' order.
- [ ] The two yaml_serialization tests are re-examined. If
      `psych-dump-type-constants` still blocks them, they stay `BLOCKED:` on it.

## Verification

`pnpm vitest run packages/activerecord/src/yaml-serialization.test.ts`.
