---
title: "test-compare: the Ruby extractor records a zip(...).each test loop as one case"
status: draft
updated: 2026-10-11
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

`scripts/test-compare/extract-ruby-tests.rb` expands a test-macro loop only when the receiver is a literal array (`process_test_macro_loop`, `loop_elements`). `vendor/msgpack/v1.8.0/spec/packer_spec.rb:545-552` and `spec/unpacker_spec.rb:380-389` loop over `[1, 2, 4, 8, 16].zip([0xd4, 0xd5, 0xd6, 0xd7, 0xd8]).each do |n,b|`, so each `it "msgpack fixext #{n} format"` group is recorded as ONE Ruby case (`msgpack fixext  format`) where rspec runs five.

trails#8798 ported both groups as five TS tests each (`packages/msgpack/src/packer.test.ts`, `unpacker.test.ts`). They credit as one matched case per group through the interpolation `pattern` pass (`matchesInterpolatedPath`, `scripts/test-compare/compare.ts`), the other four absorbed as siblings. The Rails-side total is therefore 8 short for msgpack.

## Acceptance criteria

- `loop_elements` resolves a literal `a.zip(b)` receiver (both operands literal arrays) to its pairs, so `|n, b|` binds per element.
- `pnpm parity:test --package msgpack` reports five Ruby cases per fixext group, each path-matched to its TS test; total and matched both rise by 8.
- A fixture test in `scripts/test-compare/extract-ruby-test-macro-loop.test.ts` covers a `zip` receiver.
