---
title: "image-processing-mini-magick-tests-composite-define-limits-append"
status: done
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9454
claim: "2026-10-29T20:30:47Z"
assignee: "image-processing-mini-magick-tests-composite-define-limits-append"
blocked-by: null
closed-reason: null
---

## Context

`packages/image-processing/src/mini-magick.test.ts` ports every `vendor/image_processing/v1.14.0/test/mini_magick_test.rb` example through `#rotate` (`:1-454`). The trailing describe blocks did not fit under the PR ceiling: `#composite` (`:456-547`, 13 examples), `#define` (`:549-567`), `#limits` (`:569-575`) and `#append` (`:577-596`).

A draft port of all four already passed locally. Two things it needed:

- "accepts a block" (`:530`) calls `composite(@landscape, &:negate)` with no kwargs. Through `Processor#apply_operation`'s `rbFSend` the marked block lands in `composite`'s options slot (`packages/image-processing/src/mini-magick.ts` `composite(overlay, {…}, block)`), so `-negate` is dropped. Move it across at the top of `composite` with `rbBlockGivenP`, as CLAUDE.md "An optional positional before trailing options or a block" requires.
- "accepts String, Pathname and #path object for mask" (`:483`) passes `mask: :invalid`. A Symbol is a JS string (CLAUDE.md, "A Ruby Symbol is a JS string, never a JS `Symbol`"), which reads as a path, so pass a non-path object (`{}`) instead.
- "accepts deprecated :compose" / ":geometry" `assert_output nil, /…/`: spy on ruby-compat's `stderr.write`, which `warn` calls.

## Acceptance criteria

- The four describe blocks are ported into `mini-magick.test.ts` in Rails order, with the Rails names verbatim.
- `composite` takes a block given without kwargs.
