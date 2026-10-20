---
title: "rbFPublicSend answers to_s for primitive receivers (form collections :to_s)"
status: draft
updated: 2026-10-20
rfc: "0154-ruby-compat-surfaced-deviations"
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

Rails' `form_collections_helper_test.rb` (`vendor/rails/v8.0.2/actionview/test/template/form_collections_helper_test.rb:22`, `:55`, `:156` and others) passes `:to_s` as the value/text method over collections of `true`/`false`, Strings and numbers. `value_for_collection` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_options_helper.rb:830`) is `value.respond_to?(:call) ? value.call(item) : item.public_send(value)`, ported as `valueForCollection` (`packages/actionview/src/helpers/form-options-helper.ts:394`) over `rbFPublicSend`.

`rbFPublicSend(1, "to_s")` / `rbFPublicSend(true, "to_s")` raise `NoMethodError` ("undefined method 'to_s' for an instance of Integer"), checked 2026-10-20. So trails#9156's port passes `"toString"` (JS `Number.prototype.toString`) wherever Rails passes `:to_s`. Ruby's `Kernel#to_s` / `Integer#to_s` / `TrueClass#to_s` (`vendor/ruby/v3.3.11/object.c`, `numeric.c`) exist on every receiver, and ruby-compat already has the string forms (`rbObjAsString`, `floToS` in `packages/ruby-compat/src/object.ts:1660-1710`).

## Acceptance criteria

- [ ] `rbFPublicSend(x, "to_s")` answers Ruby's `to_s` for a JS number, bigint, boolean, `null` (`""`), string and a record (through its `toS` / `toString`), by a direct arm or an `OBJECT_METHOD_TABLE` entry, not by widening `sendInternal`'s name guessing.
- [ ] `packages/actionview/src/template/form-collections-helper.test.ts` passes `"to_s"` everywhere Rails passes `:to_s` (`"toString"` removed).
