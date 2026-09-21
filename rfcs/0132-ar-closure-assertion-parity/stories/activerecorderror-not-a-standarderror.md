---
title: "ActiveRecordError extends Error, not StandardError"
status: done
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#7935
claim: "2026-09-21T17:54:07Z"
assignee: "assertions-activesupport-cache-xml-json-callbacks"
blocked-by: null
closed-reason: null
---

## Context

Rails: `class ActiveRecordError < StandardError` (`vendor/rails/activerecord/lib/active_record/errors.rb:7`).
trails: `export class ActiveRecordError extends Error` (`packages/activerecord/src/errors.ts:4`), so no AR error is a ruby-compat `StandardError`.

Found in trails#7930. `associations_test.rb:1434` uses a bare `assert_raises`, which is minitest's default `StandardError`. The port (`packages/activerecord/src/associations.test.ts`, `preload wont set the wrong target`) cannot assert `[StandardError]`, because `AssociationNotFoundError` is not one. It fails with "StandardError expected, not ActiveRecord::AssociationNotFoundError". The port therefore still asserts `[Error]`.

## Acceptance criteria

- `ActiveRecordError extends StandardError` from `@blazetrails/ruby-compat`, mirroring `errors.rb:7`.
- `preload wont set the wrong target` asserts `[StandardError]`.
