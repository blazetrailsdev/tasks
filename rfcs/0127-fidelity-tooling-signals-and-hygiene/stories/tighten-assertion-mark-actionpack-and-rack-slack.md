---
title: "Tighten the assertion-mismatch mark for actiondispatch, actioncontroller and rack"
status: draft
updated: 2026-10-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/assertion-mismatch-mark.json` carries slack that
`pnpm parity:test:assertions` reports as green, because the ratchet has no
staleness arm. Measured on trails#8410's branch (2026-10-02) by running
`pnpm parity:test:assertions:reseed` and reading the diff before reverting it:

| package          | dimension      | mark | measured |
| ---------------- | -------------- | ---- | -------- |
| actiondispatch   | assertionCount | 357  | 310      |
| actiondispatch   | kind           | 513  | 468      |
| actiondispatch   | value          | 72   | 70       |
| actioncontroller | assertionCount | 283  | 256      |
| actioncontroller | kind           | 463  | 393      |
| actioncontroller | value          | 76   | 58       |
| rack             | assertionCount | 332  | 331      |

trails#8410 removed about 24 count and 24 kind mismatches from
`dispatch/prefix_generation_test.rb` and did not write the mark down, because
the only writer is a whole-file reseed that would also have captured the other
packages' slack (`assertion-mark-reseed-rewrites-unrelated-packages`, RFC 0127).
Until the mark is tightened, up to that many new mismatches can land in those
packages with the gate green.

## Acceptance criteria

- The three packages' counters in `assertion-mismatch-mark.json` equal the
  values a fresh `pnpm parity:test --json` measures on `main`.
- No other package's counter moves in the same commit.
- `pnpm parity:test:assertions` is green.
