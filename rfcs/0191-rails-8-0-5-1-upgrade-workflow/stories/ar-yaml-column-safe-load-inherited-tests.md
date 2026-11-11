---
title: "YAMLColumnTestWithSafeLoad runs YAMLColumnTest's inherited tests"
status: ready
updated: 2026-11-11
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the 8.0.2 entry check (trails `876804dd8b`): `parity:test` puts
`coders/yaml_column_test.rb` at 15/23, with 8 missing.

Rails: `class YAMLColumnTestWithSafeLoad < YAMLColumnTest`
(`vendor/rails/v8.0.2/activerecord/test/cases/coders/yaml_column_test.rb:77`) inherits
YAMLColumnTest's tests (`:17-75`: initialize takes class, type mismatch on
different classes on dump, type mismatch on different classes, nil is ok,
returns new with different class, returns string unless starts with dash, load
raises on other classes, load doesnt swallow yaml exceptions), so Minitest runs
them again with `use_yaml_unsafe_load = false`. Its own
`test_load_doesnt_handle_undefined_class_or_module` (`:152`) overrides the
parent's. trails' `describe("YAMLColumnTestWithSafeLoad")`
(`packages/activerecord/src/coders/yaml-column.test.ts:117`) holds only the
subclass's own tests.

## Acceptance criteria

- [ ] The 8 inherited tests run under `YAMLColumnTestWithSafeLoad`'s setup,
      with names that match Rails verbatim and no shared helper Rails lacks
      beyond what the settled inherited-test-case idiom uses.
- [ ] `pnpm parity:test` shows `coders/yaml_column_test.rb` at 23/23.
