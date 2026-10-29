---
title: "chainable.ts as an entry module: break the Builder/Chainable module-eval cycle"
status: done
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9433
claim: "2026-10-29T14:05:29Z"
assignee: "image-processing-chainable-builder-module-cycle"
blocked-by: null
closed-reason: null
---

## Context

`packages/image-processing/src/builder.ts` ends with a module-eval `include(Builder, Chainable)`, and `chainable.ts` imports `Builder` (for `branch`'s `this.is_a?(Builder)`, `chainable.rb:65`, and `Builder.new`, `:79`). Entering the graph at `chainable.ts` evaluates `builder.ts` while `Chainable` is still in TDZ, and it throws. Only entry through `image-processing.ts` (which imports `builder.js` first) works. That is the module-eval cycle described in CLAUDE.md § "Call-time constant resolution".

## Acceptance criteria

- A plain-node import of the built `dist/chainable.js` as the entry module succeeds.
- Use the sanctioned shape: an `ActiveSupport::Autoload`-style namespace seat for `ImageProcessing.Builder`, read at call time in `branch`, mirroring `image_processing.rb`'s requires.
