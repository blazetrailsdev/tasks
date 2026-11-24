---
title: "TSE compiler marks template blocks as Ruby blocks"
status: draft
updated: 2026-11-24
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["tse-compiler"]
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

Every ERB `do ... end` is a Ruby block, but the TSE compiler (`packages/tse-compiler/lib/emit-js.ts`, `emitSteps` / `asyncArrow`) emits a template block as a bare arrow. A helper that takes its block off the end of a `*args` splat reads it with `rbBlockGivenP` (`packages/ruby-compat/lib/hash.ts:64`), so `turboFrameTag("search", () => { %>...<% })` treats the block as an id and renders the function's source (`packages/turbo/lib/app/helpers/turbo/frames-helper.ts:21-38`, Rails `turbo-rails/app/helpers/turbo/frames_helper.rb`). `examples/electron-writebook` works around it with a receipted `block()` helper in `app/helpers/application-helper.ts`.

## Acceptance criteria

- The TSE compiler wraps every template block arrow in ruby-compat's `block()` mark, so `rbBlockGivenP` answers true for it.
- `turboFrameTag(id, () => { %>…<% })` in a `.tse` renders the frame with the block's content.
- `examples/electron-writebook`'s `block` helper and its `@noRailsEquivalent CONVERGEABLE tse-compiler-marks-template-blocks` receipt are deleted and its views call `turboFrameTag` without it.
