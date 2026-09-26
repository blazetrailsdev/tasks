---
title: "GeneratedAttribute.dangerous_name? asks ActiveRecord::Base, not a hardcoded set that rejects type"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `GeneratedAttribute.dangerous_name?`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/generated_attribute.rb:68-71`) is
`defined?(ActiveRecord::Base) && ActiveRecord::Base.dangerous_attribute_method?(name)`. That in turn is
`AttributeMethods.dangerous_attribute_methods.include?(name.to_s)`
(`activerecord/lib/active_record/attribute_methods.rb:30-38,183-185`): Base's public and private
instance methods minus `Base.superclass`'s, plus `__id__ dup freeze frozen? hash class clone`.

trails' `packages/trailties/src/generators/generated-attribute.ts:16` hardcodes
`DANGEROUS = new Set(["id", "type", "save", "destroy", "errors", "attributes"])`. That list is
both too narrow (every other Base method passes) and wrong for `type`: no instance method on
`ActiveRecord::Base` is named `type` (the only `def type` in active_record is
`TableMetadata#type`), so Rails accepts `type:string`, the usual STI column. `default()` even
special-cases `name == "type"` (`generated_attribute.rb:151`), which the hardcoded set makes
unreachable.

## Acceptance criteria

- `GeneratedAttribute` ports `dangerous_name?` as `isDangerousName` and asks
  ActiveRecord's `dangerousAttributeMethod` (or its equivalent), not a hardcoded set.
- `DANGEROUS` is deleted.
- `rails g model Vehicle type:string` parses; `id:integer` / `save:string` still raise Rails' message.
