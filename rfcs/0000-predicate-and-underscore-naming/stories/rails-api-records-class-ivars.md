---
title: "The Ruby API manifest records each class's ivars"
status: draft
updated: 2026-10-26
rfc: "0000-predicate-and-underscore-naming"
cluster: naming-shape-gate
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The naming-shape labeller needs to tell a Ruby `@ivar` mirror (`@new_record` → `_newRecord`) from an invented `_` name. Today the only source is a vendor grep that ignores which class assigns the ivar. The audit found 353 AR ivar-mirror names this way (RFC Motivation). The Ruby extractor that writes `rails-api.json` sees every `def` body, so it can record the `@foo` assignments per class.

## Acceptance criteria

- [ ] `rails-api.json` lists, per Ruby class/module, the ivar names assigned in its own `def` bodies (`@foo =`, `@foo ||=`, `instance_variable_set(:@foo, …)` with a literal).
- [ ] `ActiveRecord::Core` lists `new_record`, `previously_new_record`, `destroyed`, `readonly`, `strict_loading_mode`, … (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb` `init_internals`).
- [ ] Generated from vendored sources only, with no committed baseline.
