---
title: "msgpack: port the fixext ext-format and issue #127 header spec groups"
status: ready
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8671 ported these spec groups and then removed them to stay under its
LOC ceiling. `msgpack-buffer-read-and-cruby-buffer-specs` lists other
remaining tests and does not name these, so they are filed here. Every method
they exercise is already ported.

- `vendor/msgpack/v1.8.0/spec/packer_spec.rb:546-552`: `describe "ext formats"`,
  `it "msgpack fixext #{n} format"` (five sizes), over
  `MessagePack::ExtensionValue#to_msgpack`
  (`packages/msgpack/src/extension-value.ts`).
- `vendor/msgpack/v1.8.0/spec/unpacker_spec.rb:380-389`: the same group over
  `Unpacker.new(allow_unknown_ext: true)` and `#unpack`. Compare with
  `toEqual(new ExtensionValue(type, payload))`, which the assertion ratchet
  reads as Rails' `should ==`.
- `vendor/msgpack/v1.8.0/spec/unpacker_spec.rb:682-690`: `context 'regressions'`,
  `returns correct size for array16 (issue #127)` and
  `returns correct size for map16 (issue #127)`, over `read_array_header` /
  `read_map_header`.

The removed ports are in the PR's history at commit `65e2cff836`
(`packer.test.ts`, `unpacker.test.ts`).

## Acceptance criteria

- The three groups are in `packer.test.ts` / `unpacker.test.ts`, test names
  verbatim.
- `pnpm parity:test --package msgpack` matched count rises by 12;
  `pnpm parity:test:assertions` OK.
