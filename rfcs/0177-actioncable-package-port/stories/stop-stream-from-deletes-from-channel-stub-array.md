---
title: "Streams#stop_stream_from deletes from ChannelStub's Array streams"
status: draft
updated: 2026-10-27
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ChannelStub#streams` is an Array (`vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/test_case.rb:41-43`) that shares `@_streams` with `Streams#streams`, which is a Hash. `Streams#stop_stream_from` is not stubbed. It calls `streams.delete(broadcasting)`, which on the stub's Array is `Array#delete`: it returns the deleted element, or `nil` when the element is absent. When something was deleted, it calls `pubsub.unsubscribe` (`channel/streams.rb:111-118`). The Rails test at `actioncable/test/channel/test_case_test.rb:117-122` relies on this.

trails' `stopStreamFrom` (`packages/actioncable/src/channel/streams.ts:98-106`) calls `hashDelete(this.streams, broadcasting)`. On the stub's `string[]` it does a keyed delete, so the broadcasting is never removed from the Array and the unsubscribe is skipped.

## Acceptance criteria

- [ ] `stopStreamFrom` removes the broadcasting from the stub's Array and unsubscribes, as Ruby's polymorphic `delete` does. Use a dispatching `delete` helper that takes the Array arm, not a stub override.
- [ ] The Rails case at `test_case_test.rb:117-122` passes once `port-actioncable-channel-test-case-test` ports it.
