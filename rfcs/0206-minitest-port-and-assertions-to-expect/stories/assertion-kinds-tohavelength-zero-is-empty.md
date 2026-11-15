---
title: "assertion-kinds credits toHaveLength(0) as assert_empty"
status: draft
updated: 2026-11-15
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CONTRIBUTING.md § "Porting a Minitest assertion" maps Minitest `assert_empty o`
(`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:188`) to the built-in
`expect(o).toHaveLength(0)`. It keeps `toBeEmpty()` only for a receiver with no
`length`.

`scripts/test-compare/assertion-kinds.ts:279` maps `toHaveLength` to the kind
`length`, not `empty`; only `toBeEmpty` maps to `empty` (`:276`). So a port that
follows the table reds the assertion-mismatch ratchet against Rails'
`assert_empty`. Seen on trails#10108: `packages/vite-assets/test/builder.test.ts`
ports `vendor/vite_ruby/v3.11.1/test/builder_test.rb:51` and `:97` as
`toBeEmpty()` on a String and an Array to stay green.

## Acceptance criteria

- `expect(x).toHaveLength(0)` is credited as kind `empty` (any other
  `toHaveLength(n)` stays `length`), with a test in the test-compare suite.
- `builder.test.ts:86` and `:135` use `toHaveLength(0)`, per the table.
- The ratchet stays green.
