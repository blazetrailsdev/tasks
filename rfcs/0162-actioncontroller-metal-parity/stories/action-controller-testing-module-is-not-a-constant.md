---
title: "ActionController::Testing has no constant; Functional is a plain object"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
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

`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/testing.rb:5-24`
defines `module ActionController::Testing` with the nested
`module Functional`. `packages/actionpack/src/action-controller/metal/testing.ts`
exports `Functional` as a plain object and no `Testing`.

Rails' `SendFileController` has `include ActionController::Testing`
(`vendor/rails/v8.0.2/actionpack/test/controller/send_file_test.rb:13`). The
include adds no method in 8.0.2, and trails#8619's port of that controller
(`packages/actionpack/src/action-controller/controller/send-file.test.ts`) omits
the line because there is no constant to include.

## Acceptance criteria

- `metal/testing.ts` exports `Testing` as a `Module` seated on `ActionController`,
  with `Functional` nested on it as a `Module`.
- `test-case.ts` includes `Testing.Functional` where `test_case.rb` does.
- `SendFileController` in `send-file.test.ts` has `include(this, Testing)`.
