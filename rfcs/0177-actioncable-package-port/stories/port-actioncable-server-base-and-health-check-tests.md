---
title: "Port server/base_test.rb and server/health_check_test.rb"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps:
  [
    "port-actioncable-connection-base",
    "port-actioncable-inline-async-and-test-adapters",
    "port-actioncable-test-stubs-and-test-helper",
  ]
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/server/base_test.rb` (38 lines, 3 cases) and
`server/health_check_test.rb` (57 lines, 3 cases). Both build a real
`ActionCable::Server::Base` with `cable = { adapter: "async" }`, so they wait
for the async adapter; the health check's first case sends a non-WebSocket
request through `Server::Base#call` to a real `Connection::Base` and expects
its 404, so it waits for that too.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/server/base_test.rb`:
  - [ ] `#restart closes all open connections` (`:18`)
  - [ ] `#restart shuts down worker pool` (`:27`)
  - [ ] `#restart shuts down pub/sub adapter` (`:33`)
- `vendor/rails/v8.0.2/actioncable/test/server/health_check_test.rb`:
  - [ ] `no health check app are mounted by default` (`:17`)
  - [ ] `setting health_check_path mount the configured health check application` (`:22`)
  - [ ] `health_check_application_can_be_customized` (`:30`)

## Fidelity traps (predicted at authoring)

- [ ] **`server/base_test.rb`'s three cases** stub one collaborator each (`conn.close`, `worker_pool.halt`, `pubsub.shutdown`) and assert `restart` called it. `restart` is async in trails; await it inside the `assert_called` block.
- [ ] **`health_check_test.rb` wraps the server in `Rack::Lint`** (`:13`). The health check response and the 404 must both satisfy it, including the `date` header and an enumerable body.
- [ ] **"no health check app are mounted by default"** requests `/up` and expects 404: with `health_check_path` nil the request falls through to the connection class.
- [ ] **`response.last.enum_for.to_a`** enumerates the Rack body; the default app's body is `[]`.
- [ ] **The test file's `get(path)` ignores its argument** and always requests `/up` (`:42`). Port it as written.

## Acceptance criteria

- [ ] All 6 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.

## Definition of done

A skipped or renamed case does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/server/base.test.ts packages/actioncable/src/server/health-check.test.ts
pnpm parity:test && pnpm parity:test:assertions   # every case listed above credited; actioncable mark stays 0
```
