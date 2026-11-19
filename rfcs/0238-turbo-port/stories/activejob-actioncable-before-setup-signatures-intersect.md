---
title: "ActiveJob TestHelper and ActionCable TestCase beforeSetup types conflict"
status: done
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10320
claim: "2026-11-18T21:53:07Z"
assignee: "activejob-actioncable-before-setup-signatures-intersect"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveJob::TestHelper#before_setup`
(`vendor/rails/v8.0.2/activejob/lib/active_job/test_helper.rb:41`) and
ActionCable's channel test case both define `before_setup` and chain with
`super`, so a test class that includes both (turbo-rails'
`Turbo::BroadcastableTest < ActionCable::Channel::TestCase` with
`include ActiveJob::TestHelper`,
`vendor/turbo-rails/v2.0.23/test/streams/broadcastable_test.rb:5-6`) is one
coherent type.

In trails the two declarations disagree: `packages/activejob/lib/test-helper.ts:590`
types `beforeSetup` as returning `Promise<unknown>`, while
`packages/actioncable/lib/channel/test-case.ts:193` (`Behavior`) declares its
own `beforeSetup` returning `unknown`. Their intersection is unusable:
`BroadcastableTest & ActiveJobTestHelper & Included<typeof ActionHelper>` fails
TS2684 on every `assertNoBroadcasts` call, so
`packages/turbo/test/streams/broadcastable.test.ts` and
`streams-channel.test.ts` type `testCase` as `any`.

## Acceptance criteria

- Both `beforeSetup` (and `afterTeardown`) declarations share one compatible
  signature (async, as a `super`-chained hook that may await is).
- `broadcastable.test.ts` and `streams-channel.test.ts` type `testCase` as the
  intersection of the test class and its included helpers, with no
  `no-explicit-any` disable.
