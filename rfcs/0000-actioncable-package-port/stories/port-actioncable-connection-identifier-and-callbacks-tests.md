---
title: "Port connection/identifier_test.rb, multiple_identifiers_test.rb, string_identifier_test.rb and callbacks_test.rb"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-connection-base", "port-actioncable-test-stubs-and-test-helper"]
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/connection/identifier_test.rb` (77 lines, 4 cases),
`multiple_identifiers_test.rb` (34, 1), `string_identifier_test.rb` (36, 1)
and `callbacks_test.rb` (100, 3).

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/connection/identifier_test.rb`:
  - [ ] `connection identifier` (`:19`)
  - [ ] `should subscribe to internal channel on open and unsubscribe on close` (`:26`)
  - [ ] `processing disconnect message` (`:43`)
  - [ ] `processing invalid message` (`:53`)
- `vendor/rails/v8.0.2/actioncable/test/connection/multiple_identifiers_test.rb`:
  - [ ] `multiple connection identifiers` (`:17`)
- `vendor/rails/v8.0.2/actioncable/test/connection/string_identifier_test.rb`:
  - [ ] `connection identifier` (`:19`)
- `vendor/rails/v8.0.2/actioncable/test/connection/callbacks_test.rb`:
  - [ ] `before and after callbacks` (`:63`)
  - [ ] `before callback halts` (`:72`)
  - [ ] `around_command callback` (`:80`)

## Fidelity traps (predicted at authoring)

- [ ] **"should subscribe to internal channel on open and unsubscribe on close"** reads `SuccessAdapter`'s class variables (`class_variable_get "@@subscribe_called"` and `"@@unsubscribe_called"`) after `wait_for_async` and asserts the channel is `"action_cable/User#lifo"` and the callback a Proc.
- [ ] **"processing disconnect message"** and "processing invalid message" make `process_internal_message` public on the test subclass (`public :process_internal_message`) and assert `websocket.close` was or was not called.
- [ ] **`callbacks_test.rb` asserts `handle_channel_command`'s return value**: truthy when the chain ran, falsy when a `before_command` halted it (`assert result` / `assert_not result`, `:69,77`). The async port must resolve to `run_callbacks`' result.
- [ ] **"around_command callback"** sets `env["QUERY_STRING"] = "context=test"` and reads `request.params["context"]` in the around callback.
- [ ] **"multiple connection identifiers"** expects the gid params sorted and joined: `"Room#my-room:User#lifo"`.
- [ ] **`string_identifier_test.rb`** identifies by a plain String token: `connection_identifier` is that string.
- [ ] **"before callback halts"** uses `throw :abort` in a `before_command`; "around_command callback" asserts the order of before, around and after.

## Acceptance criteria

- [ ] All 9 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.

## Definition of done

A skipped or renamed case does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/connection/identifier.test.ts packages/actioncable/src/connection/multiple-identifiers.test.ts packages/actioncable/src/connection/string-identifier.test.ts packages/actioncable/src/connection/callbacks.test.ts
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
