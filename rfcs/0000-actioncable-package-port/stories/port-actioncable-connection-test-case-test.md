---
title: "Port connection/test_case_test.rb"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps: ["port-actioncable-connection-test-case"]
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/connection/test_case_test.rb` (213 lines, 17 cases in five test
classes), each with its own connection class: `SimpleConnection`,
`Connection`, `EncryptedCookiesConnection`, `SessionConnection`,
`EnvConnection`.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/connection/test_case_test.rb`:
  - [ ] `connected` (`:24`, `ConnectionSimpleTest`)
  - [ ] `url params` (`:30`, `ConnectionSimpleTest`)
  - [ ] `params` (`:36`, `ConnectionSimpleTest`)
  - [ ] `plain cookie` (`:42`, `ConnectionSimpleTest`)
  - [ ] `plain cookie with explicit value and string key` (`:50`, `ConnectionSimpleTest`)
  - [ ] `disconnect` (`:58`, `ConnectionSimpleTest`)
  - [ ] `connected with signed cookies and headers` (`:92`, `ConnectionTest`)
  - [ ] `connected when no signed cookies set` (`:101`, `ConnectionTest`)
  - [ ] `connection rejected` (`:107`, `ConnectionTest`)
  - [ ] `connection rejected assertion message` (`:111`, `ConnectionTest`)
  - [ ] `connected with encrypted cookies` (`:136`, `EncryptedCookiesConnectionTest`)
  - [ ] `connected with encrypted cookies with explicit value and symbol key` (`:144`, `EncryptedCookiesConnectionTest`)
  - [ ] `connection rejected` (`:152`, `EncryptedCookiesConnectionTest`)
  - [ ] `connected with encrypted cookies` (`:173`, `SessionConnectionTest`)
  - [ ] `connection rejected` (`:178`, `SessionConnectionTest`)
  - [ ] `connected with env` (`:200`, `EnvConnectionTest`)
  - [ ] `connection rejected` (`:210`, `EnvConnectionTest`)

## Fidelity traps (predicted at authoring)

- [ ] **`ConnectionTest` has no `tests` call**: the connection class is inferred from the test class name.
- [ ] **Case names repeat** (`connection rejected` in three classes, `connected with encrypted cookies` in two). Keep each under its Ruby class's `describe`.
- [ ] **"params"** passes `params: { user_id: 323 }` and expects the String `"323"`: it went through `to_query`.
- [ ] **"plain cookie with explicit value and string key"** and "connected with encrypted cookies with explicit value and symbol key" set `{ "value" => "456" }` and `{ value: "456" }`.
- [ ] **"connected with signed cookies and headers"** reads `request.headers["X-API-TOKEN"]` and calls `logger.add_tags("ActionCable")`.
- [ ] **"connected when no signed cookies set"** sets a plain cookie and expects rejection: `cookies.signed` is a separate hash.
- [ ] **"disconnect"** asserts a class-level `disconnected_user_id` set by the connection's `disconnect`.
- [ ] **"connected with env"** passes `env: { "authenticator" => … }` and the connection reads `env["authenticator"]&.user`: `TestConnection#initialize` sets `@env = request.env`, and `Connection::Base`'s `attr_reader :env` reads it.

## Acceptance criteria

- [ ] All 17 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.

## Definition of done

A skipped or renamed case does not close this story.
