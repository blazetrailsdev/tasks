---
title: "activerecord: port Core.attributes_for_inspect (class_attribute)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`core.rb → core.ts` scores 113/114; the miss is `attributes_for_inspect`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:119,884`), declared by `class_attribute :attributes_for_inspect,
instance_accessor: false, default: :all` and read by `Core#inspect` / `#attributes_for_inspect`.
trails' `inspect` (`packages/activerecord/src/core.ts:53`) renders every attribute. The settled shape is
`classAttribute()` (CLAUDE.md § "Module mixins").

## Acceptance criteria

- [ ] `attributesForInspect` is a `classAttribute` with Rails' `:all` default (spelled `":all"`, the Ruby-Symbol convention), and `inspect` honours it exactly as `core.rb` does.
- [ ] The `core_test.rb` cases around `attributes_for_inspect` are ported or confirmed green.
- [ ] `core.rb` scores 114/114.
