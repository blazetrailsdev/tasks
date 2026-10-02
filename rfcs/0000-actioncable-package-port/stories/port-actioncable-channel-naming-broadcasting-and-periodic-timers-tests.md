---
title: "Port channel/naming_test.rb, broadcasting_test.rb and periodic_timers_test.rb"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps: ["port-actioncable-channel-base", "port-actioncable-test-stubs-and-test-helper"]
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/test/channel/naming_test.rb` (12 lines, 1 case),
`channel/broadcasting_test.rb` (48 lines, 4) and
`channel/periodic_timers_test.rb` (85 lines, 5).

## Rails tests owned by this story

- `vendor/rails/v8.0.2/actioncable/test/channel/naming_test.rb`:
  - [ ] `channel_name` (`:9`)
- `vendor/rails/v8.0.2/actioncable/test/channel/broadcasting_test.rb`:
  - [ ] `broadcasts_to` (`:15`)
  - [ ] `broadcasting_for with an object` (`:28`)
  - [ ] `broadcasting_for with an array` (`:35`)
  - [ ] `broadcasting_for with a string` (`:42`)
- `vendor/rails/v8.0.2/actioncable/test/channel/periodic_timers_test.rb`:
  - [ ] `periodic timers definition` (`:30`)
  - [ ] `disallow negative and zero periods` (`:41`)
  - [ ] `disallow block and arg together` (`:50`)
  - [ ] `disallow unknown args` (`:57`)
  - [ ] `timer start and stop` (`:66`)

## Fidelity traps (predicted at authoring)

- [ ] **`naming_test.rb`** expects `"action_cable:channel:naming_test:chat"` for a `ChatChannel` nested in the test class.
- [ ] **"broadcasts_to"** stubs `ActionCable.server.broadcast` with `assert_called_with` and expects `"action_cable:channel:broadcasting_test:chat:Room#1-Campfire"`. `broadcast_to` returns a promise in trails; await it inside the stub block.
- [ ] **"broadcasting_for with an array"** passes `[Room, User]` stubs and joins their gid params with `:`.
- [ ] **"disallow negative and zero periods"** iterates eight invalid values including `0.seconds` and `-1.seconds`, so the test file needs `ActiveSupport::Duration`'s numeric extensions.
- [ ] **"timer start and stop"** stubs `event_loop.timer` three times, each returning a mock expecting `shutdown`, and then verifies the mock.

## Acceptance criteria

- [ ] All 10 cases are ported under their Rails names and credited in `parity:test`.
- [ ] `pnpm parity:test:assertions` stays at 0 for actioncable.

## Definition of done

A skipped or renamed case does not close this story.
