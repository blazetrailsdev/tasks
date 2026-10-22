---
title: "Make mini_magick's specs native, typed vitest"
status: ready
updated: 2026-10-22
rfc: "0203-mini-magick-port-to-100"
cluster: mini-magick-polish
packages: ["mini-magick"]
deps: ["mini-magick-land-on-main"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The specs are RSpec lowered to vitest
(`packages/mini-magick/src/*.test.ts`, `test-helpers/spec-helper.ts`,
`test-helpers/support/helpers.ts`). What the lowering leaves:

- `subject` / `let` are describe-scoped `let x: unknown` set in `beforeEach`, so
  each use is untyped (`subject` is a `Tool` in `tool_spec.rb`, an `Image` in
  `image_spec.rb`).
- rspec-mocks on a reader, such as `allow(MiniMagick).to receive(:graphicsmagick)`
  (`tool_spec.rb:56`, 28 `receive` sites across the specs), are
  `vi.spyOn(obj, name)`, which throws "cannot spy on a non-function value" on
  an accessor. A reader needs `vi.spyOn(obj, name, "get")`.
- The five lint fixes on `5f96afb0a0` (listed in its commit message) are
  placeholders for the native forms.

## Acceptance criteria

- `subject` and each `let` carry the type of the value they hold.
- Every rspec-mocks site spies the member in its real shape (method or getter),
  and the message expectations still assert in each example's tail.
- Each example keeps its RSpec description as its `it` title (CLAUDE.md "NEVER
  rename or reword test names").
