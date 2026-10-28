---
title: "mini-magick-image-ctor-block-async-combine-options"
status: ready
updated: 2026-10-28
rfc: "0203-mini-magick-port-to-100"
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

`MiniMagick::Image#initialize` ends `combine_options(&block) if block`
(`vendor/mini_magick/v5.2.0/lib/mini_magick/image.rb:149-155`). In trails
`combineOptions` is `mogrify`, an awaited child process, and a JS constructor
cannot await, so `packages/mini-magick/src/image.ts`'s constructor fires
`this.combineOptions(block)` and drops the promise. The spec
`#initialize accepts a block which it passes on to #combine_options`
(`vendor/mini_magick/v5.2.0/spec/lib/mini_magick/image_spec.rb`, `#initialize`)
reads `dimensions` before that mogrify has run, so
`packages/mini-magick/src/image.test.ts` keeps it `it.skip`
(`// BLOCKED: mini-magick-image-ctor-block-async-combine-options`). The owner
deferred the decision on 2026-10-28 (trails PR closing
mini-magick-image-spec-remaining-fails).

## Acceptance criteria

- The owner decides the shape: converge (e.g. the constructor's pending
  mogrify is awaited by the next image read) or ratify a section so the
  example is parked `PERMANENT-SKIP`.
- The constructor no longer drops a rejected promise unhandled.
- `image.test.ts`'s example passes or carries the `PERMANENT-SKIP` line.
