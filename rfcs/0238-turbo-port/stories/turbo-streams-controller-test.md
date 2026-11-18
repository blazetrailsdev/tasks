---
title: "turbo-streams-controller-test"
status: draft
updated: 2026-11-18
rfc: "0238-turbo-port"
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
closed-reason: null
---

## Context

`vendor/turbo-rails/v2.0.23/test/streams/streams_controller_test.rb` (7 tests)
exercises `Turbo::Streams::TagBuilder` through the dummy controllers and
`*.turbo_stream.tse` views. It needs `assert_turbo_stream` /
`assert_no_turbo_stream` (`lib/turbo/test_assertions.rb`), which are not
ported. TagBuilder itself landed in
`packages/turbo/lib/app/models/turbo/streams/tag-builder.ts`, and the dummy
views already await `turboStream.*`.

## Acceptance criteria

- `Turbo::TestAssertions#assert_turbo_stream` / `assert_no_turbo_stream` are
  ported by `turbo-test-helpers` first.
- All 7 tests in `streams_controller_test.rb` are ported under their upstream
  names in `packages/turbo/test/streams/streams-controller.test.ts`.
