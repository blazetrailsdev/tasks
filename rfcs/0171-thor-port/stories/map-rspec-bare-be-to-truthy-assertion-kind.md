---
title: "Map RSpec's bare be matcher to truthy; converge command_spec's dup options hash onto toBeTruthy"
status: done
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8538
claim: "2026-10-05T15:39:48Z"
assignee: "arms-extractor-reads-a-block-re-forward-guard"
blocked-by: null
closed-reason: null
---

## Context

RSpec's bare `be` (no argument) passes for any truthy value:
`expect(command.options[:foo]).to be` (`vendor/thor/v1.3.2/spec/command_spec.rb:59`).
`RSPEC_MAP` (`scripts/test-compare/assertion-kinds.ts:158`) has one row for the matcher,
`expect_to_be: "equal"`, which is right for `be(x)` (identity) and wrong for the bare form. So the
faithful port, `expect(command.options.foo).toBeTruthy()`, reds the assertion ratchet:

```text
thor  assertion-kind-mismatch: 1 (mark 0, +1)
command_spec.rb › dup options hash — equal rails 1 vs trails 0, truthy rails 0 vs trails 1
```

trails#8414 shipped `toBe(true)` in `packages/trailties/src/thor/command.test.ts` ("dup options
hash") to stay green. It is stricter than the spec: it holds only because the stored value is
literally `true`.

This is a different gap from the predicate / chained matchers
`map-rspec-predicate-and-chained-matchers-to-assertion-kinds` covers.

## Acceptance criteria

- [ ] The Ruby extractor tells bare `be` from `be(x)`, and the bare form maps to `truthy`
      (`not_to be` to `falsy`).
- [ ] `command.test.ts` "dup options hash" asserts `toBeTruthy()`, and the thor assertion mark
      stays at 0.
- [ ] Other bare-`be` sites in `vendor/thor/v1.3.2/spec` are listed in the PR so their ports can
      follow.
