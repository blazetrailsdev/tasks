---
title: "msgpack: port pack_spec.rb"
status: ready
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/msgpack/v1.8.0/spec/pack_spec.rb` has three examples and
`packages/msgpack/src/pack.test.ts` does not exist (`parity:test` reports
`pack_spec.rb` 0/3):

- `to_msgpack returns String` (`pack_spec.rb:10-19`)
- `calls custom to_msgpack method` (`:37-42`)
- `calls custom to_msgpack method with io` (`:44-60`)

The first two are portable today: trails PR 8650 ported `core_ext.rb` and the
identical `packer_spec.rb` examples already pass in
`packages/msgpack/src/packer.test.ts` (use `rbObjClass(x)` `toBe(rbCString)` for
`.class.should == String`, which keeps the assertion kind `equal`). They were
written and then dropped from that PR only to fit its LOC ceiling. The third
needs IO-backed buffers (`msgpack-packer-unpacker-remaining-c-surface`).

## Acceptance criteria

- `packages/msgpack/src/pack.test.ts` ports the first two examples under their
  gem names, in `describe("MessagePack")`.
- The `with io` example is ported once `Packer.new(io)` writes through, or left
  to `msgpack-packer-unpacker-remaining-c-surface` with a line in that story.
- msgpack assertion ratchet stays 0/0/0; `pnpm parity:test` delta non-negative.
