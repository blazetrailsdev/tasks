---
title: "ruby-compat-json-load-create-additions-argument-error"
status: closed
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "fixed in trails#7886"
---

## Context

Surfaced converging `encryption/message_serializer_test.rb` "won't load classes from JSON"
(`vendor/rails/activerecord/test/cases/encryption/message_serializer_test.rb:24-29`).

Rails asserts `assert_raises(ArgumentError) { JSON.load(class_loading_payload) }` for a payload
carrying `json_class`, then `assert_nothing_raised { @serializer.load(...) }`.

trails' `JSON.load` (`packages/ruby-compat/src/json.ts:29`) is a bare `globalThis.JSON.parse`,
so it never raises. Test parked `it.skip` in
`packages/activerecord/src/encryption/message-serializer.test.ts`, converged body intact.
Not investigated beyond that; whether json 2.x create_additions default raising applies in
`vendor/ruby` was not checked.

## Acceptance criteria

- `JSON.load` raises ArgumentError for a `json_class` payload as MRI's json gem does.
- The parked test is un-skipped and passes.
