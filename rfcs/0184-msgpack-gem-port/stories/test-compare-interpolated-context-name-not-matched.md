---
title: "test-compare: a Ruby context name with an interpolation is not matched against the expanded TS describe"
status: draft
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
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

`pnpm parity:test --package msgpack` reports 1 wrong describe and 2 extra for
`packages/msgpack/src/packer.test.ts`'s `#write_float32` group, a faithful port
of `vendor/msgpack/v1.8.0/spec/packer_spec.rb:172-194`:

```ruby
tests.each do |ctx, numeric, packed|
  context("with #{ctx}") do
    it("encodes #{numeric} as float32") do
```

The Ruby extractor records one test with the interpolations blanked,
`#write_float32 > with  > encodes  as float32`
(`scripts/test-compare/output/rails-tests.json`). The TS extractor expands the
loop statically into four,
`MessagePack::Packer > #write_float32 > with small floats > encodes 3.14 as float32`
and so on (`ts-tests.json`). The comparer matches an interpolated `it` name
(the `msgpack fixext #{n} format` tests match) and does not match an
interpolated `context` / `describe` name, so one of the four is credited as
"wrong describe" and the rest count as extra.

## Acceptance criteria

- `scripts/test-compare/compare.ts` matches an ancestor `describe` / `context`
  name carrying a Ruby interpolation the way it already matches an `it` name.
- The `#write_float32` group reports 0 wrong describe and 0 extra, with no
  change to `packer.test.ts`.
- A fixture test in `scripts/test-compare/` covers an interpolated `context`.
