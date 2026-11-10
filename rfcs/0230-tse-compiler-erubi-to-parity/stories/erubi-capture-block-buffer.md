---
title: "Port Erubi::CaptureBlockEngine::Buffer (<<, |, capture and h)"
status: draft
updated: 2026-11-10
rfc: "0230-tse-compiler-erubi-to-parity"
cluster: null
packages:
  - "tse-compiler"
deps: []
deps-rfc: []
est-loc: 120
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
(`vendor/erubi/1.13.1/lib/erubi/capture_block.rb:32-64`). `Buffer < ::String` has four members:
`<<(v)` concatenates `v.to_s`; `|(v)` concatenates `h(v)`; `capture(*args)`
saves a `dup`, clears the receiver, yields, returns a `dup` of what the block
appended, and restores the saved content in `ensure`; private `h` is
`Erubi.h`. trails has no mutable String carrier (CLAUDE.md § "Ruby Strings are
JS string primitives"), so `Buffer` ports as a class that holds its content in a
string field, the shape ActionView's `OutputBuffer` has. `<<` and `|` take the
operator spellings in trails' `scripts/parity/conventions.ts`. TS:
`packages/tse-compiler/lib/capture-block.ts`, whose `bufval` default already
names `::Erubi::CaptureBlockEngine::Buffer.new` (:7).

## Acceptance criteria

- [ ] `Buffer` is ported in `capture-block.ts` with all four members at their
      Ruby names (operator spellings from `conventions.ts`).
- [ ] A `*.trails.test.ts` pins the behaviour: `<<` appends `to_s`, `|` appends
      the escaped value, `capture` returns only what the block appended and
      restores the outer content, including when the block raises.
- [ ] `pnpm parity:api` reports erubi 23/23.
