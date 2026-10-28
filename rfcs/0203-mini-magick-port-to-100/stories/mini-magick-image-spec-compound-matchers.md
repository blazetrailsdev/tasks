---
title: "Port image_spec's be_a(...).and be_nonzero compound checks in full"
status: draft
updated: 2026-10-28
rfc: "0203-mini-magick-port-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/mini_magick/v5.2.0/spec/lib/mini_magick/image_spec.rb` "has attributes"
asserts `expect(subject.width).to be_a(Integer).and be_nonzero` (and the same
for `height` and `size`), plus `expect(subject.human_size).to be_a(String).and be_nonempty`.
Each RSpec compound matcher is ONE expectation. To keep the assertion
ratchet at zero, trails#9398 ported each as `expect(x).toBeTypeOf(...)` only,
in `packages/mini-magick/src/image.test.ts` ("has attributes"), and dropped
the `be_nonzero` / `be_nonempty` halves.

## Acceptance criteria

- Each compound check ports as one assertion that checks both halves. For
  example, a `@blazetrails/vitest-matchers` matcher that the assertion-kind
  extractor scores as `kindOf`, or an extractor rule that reads RSpec `.and`
  compounds kind-by-kind.
- `pnpm parity:test:assertions` stays at zero for mini-magick.
