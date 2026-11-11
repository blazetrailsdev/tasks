---
rfc: "0230-tse-compiler-erubi-to-parity"
title: "tse-compiler (erubi) to parity"
status: closed
created: 2026-11-09
updated: 2026-11-11
owner: "@deanmarano"
packages:
  - "tse-compiler"
clusters: []
---

# RFC 0230 — tse-compiler (erubi) to parity

## Summary

Close the last erubi gaps in `packages/tse-compiler`, the package that ports
erubi 1.13.1.

## Motivation

Enrollment is done: `vendor-erubi-pair-tse-compiler` and
`tse-compiler-mirror-erubi-files` (RFC `0225-package-pages-data-completeness`,
done) vendored erubi and paired it with tse-compiler, and
`tse-compiler-erubi-capture-engines` ported the capture engines. trailmap's
"api 0/23, tests 0/39, never enrolled" predates them. `pnpm parity:api` /
`parity:test` on 2026-11-09: erubi api 21/23, tests 38/39 by file, with seven
Ruby examples unmatched by name.

## Design

**`Buffer`.** It ports as a class holding its content in a string field, with
`<<`, `|`, `capture` and `h` matching the gem's semantics: `capture` saves,
clears, yields, returns what the block appended and restores in a `finally`.
This mirrors ActionView's `OutputBuffer`; it is a buffer object, not a mutable
String carrier.

**Eval-only examples.** Seven examples assert only on the result of evaluating
the generated Ruby. The ported engine emits Ruby, and trails cannot evaluate
Ruby in process, so these examples need an owner ruling (open question 1)
before they can be ported.

No open story overlaps this RFC: the TSE stories in RFCs
`0140-actionview-rendering-core` and `0176-actionview-helpers` are all done or
closed, and the one predecessor, `tse-compiler-erubi-capture-block-eval-tests`,
is closed and its scope is refiled here under new ids.

## Non-goals

- **TSE's own template language** (`.tse` delimiters, the JS emitter in
  `emit-js.ts`, the stand-in harness): actionview's rendering RFCs own it, and
  it is not erubi.

## Alternatives considered

- **Assert the eval-only examples through `emit-js.ts`.** Rejected: that is the
  TSE compiler, not the erubi engine under test, so it would test the wrong
  code under the gem's names.

## Rollout

1. `erubi-capture-block-buffer` (no dependency on the question).
2. `erubi-capture-block-engine-eval-describe` and
   `erubi-eval-only-examples-outside-the-describe`, once open question 1 is ruled.

## Verification

`pnpm parity:api`: erubi 23/23. `pnpm parity:test`: every erubi Ruby example
matched by name.

## Open questions

1. **How does an example that asserts only on `eval` of the generated Ruby
   port, with no Ruby evaluator in trails?** Options: (a) a `PERMANENT-SKIP`
   ratified in CLAUDE.md § "Runtime facts Node does not expose", with each test
   body kept as the Ruby body; (b) run the generated src through the vendored
   MRI in a test lane CI provisions; (c) replace each eval assertion with a
   comparison against src that MRI's erubi generated, checked in as a fixture.
   Recommendation: (a), since (b) adds an MRI dependency to CI and (c) changes
   what the test asserts. This needs the repo owner's ruling, so the RFC stays
   `draft` until then.

   **Ruled 2026-11-11 by the operator: (a).** Each example is an `it.skip`
   under a `PERMANENT-SKIP:` line citing CLAUDE.md § "Runtime facts Node does
   not expose".

## Changelog

- 2026-11-09: initial RFC; lands `draft` until its open question is ruled on.
- 2026-11-09: revised for review feedback.
- 2026-11-11: open question 1 ruled (a).
