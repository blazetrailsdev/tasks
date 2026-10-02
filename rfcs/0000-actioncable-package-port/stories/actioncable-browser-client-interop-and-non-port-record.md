---
title: "Prove the published @rails/actioncable client talks to a trails server, and record the JS sources as non-ports"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: fidelity
packages: ["actioncable", "scripts"]
deps: ["port-actioncable-client-test-harness-and-client-cases"]
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Action Cable's browser client is already JavaScript:
`vendor/rails/v8.0.2/actioncable/app/javascript/action_cable/*.js` (11 files, about 700 lines),
published on npm as `@rails/actioncable` (8.0.2 is published as `8.0.200`).
Rails also ships three compiled bundles (`app/assets/javascripts/*.js`), a
Rollup and Karma setup, a JS test suite (`vendor/rails/v8.0.2/actioncable/test/javascript/**`, 9 files), and
`vendor/rails/v8.0.2/actioncable/test/javascript_package_test.rb`, which runs `yarn build` and asserts the
bundles did not change.

**None of it is ported** (RFC "Browser client"). A trails application depends
on `@rails/actioncable` directly; trails neither re-exports nor vendors it.
The wire protocol is what the two sides share, and `INTERNAL` on the server
(`lib/action_cable.rb:58-74`) mirrors the client's `internal.js`.

This story does two things:

1. **Record the non-ports.** `javascript_package_test.rb` already has its
   `unported-files/actioncable.ts` entry from the enrollment story; confirm
   it, and add a short section to `packages/actioncable/README.md` saying
   which npm package and version range an application installs.
2. **An interop test.** Add `@rails/actioncable` as a devDependency of
   `packages/actioncable`, pinned to the release matching the vendored Rails,
   and one test that drives its `createConsumer` against `ActionCable.server`
   behind `Rack::Handler::Node`: subscribe, receive the confirmation, perform
   an action, receive a broadcast, and survive a server-initiated disconnect.
   This is the only check that the port speaks the protocol the real client
   speaks, including the `actioncable-v1-json` subprotocol negotiation and
   the ping format.

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/javascript_package_test.rb`: **not ported** (1 case); recorded in `unported-files/actioncable.ts`.

## Fidelity traps (predicted at authoring)

- [ ] **The client assumes a browser.** `ConnectionMonitor` calls the global `addEventListener("visibilitychange", …)`, and `createWebSocketURL` touches `document` for a relative URL. In Node, pass an absolute `ws://` URL, set `adapters.WebSocket` to Node's global `WebSocket`, and provide the smallest shim that makes the monitor start. Keep the shim in the test file.
- [ ] **The subprotocol.** The client offers `actioncable-v1-json` and `actioncable-unsupported`; the server must select the first, and the client disconnects if the negotiated protocol is not one it supports.
- [ ] **The ping payload is integer seconds**; the client's monitor records it as a timestamp and reconnects when pings stop.
- [ ] **Disconnect with `reconnect: false`** must stop the client's monitor; with `reconnect: true` the client reopens.
- [ ] **Version drift.** When `vendor/rails` is bumped, the devDependency pin moves with it. Say so next to the pin.

## Acceptance criteria

- [ ] `@rails/actioncable` is a devDependency of `packages/actioncable` at the version matching the vendored Rails, and of nothing else in the repo.
- [ ] The interop test passes against a real listening server with no mocked transport.
- [ ] `javascript_package_test.rb` reads as unported with its reason in `parity:test`, and the README names the client package.

## Definition of done

A hand-written client that sends the same JSON, in place of the published package, does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src -t 'published client'
pnpm parity:test   # javascript_package_test.rb unported, with its reason
```
