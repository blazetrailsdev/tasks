---
title: "Port Erubi::CaptureBlockEngine::Buffer's capture and h"
status: draft
updated: 2026-11-09
rfc: "0000-tse-compiler-erubi-to-parity"
cluster: null
packages:
  - "tse-compiler"
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` (2026-11-09) reports erubi at 21/23; the two misses are
`Erubi::CaptureBlockEngine::Buffer#capture` and `#h`
(`vendor/erubi/1.13.1/lib/erubi/capture_block.rb:32-64`). `Buffer < ::String` appends with `<<`
and `capture` swaps its content out and back. trails has no mutable String
carrier (CLAUDE.md § "Ruby Strings are JS string primitives"), so this RFC's
Open Questions rule that `Buffer` ports as a class holding its content, the
shape ActionView's `OutputBuffer` already has. TS: `packages/tse-compiler/lib/capture-block.ts`.

## Acceptance criteria

- [ ] `Buffer` is ported in `capture-block.ts` with `capture` and `h` at their
      Ruby names, and the generated code for `CaptureBlockEngine` uses it as
      the gem's does (`bufval` default).
- [ ] `pnpm parity:api` reports erubi 23/23.
