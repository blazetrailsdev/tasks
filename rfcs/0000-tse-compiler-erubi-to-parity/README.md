---
rfc: "0000-tse-compiler-erubi-to-parity"
title: "tse-compiler (erubi) to parity"
status: active
created: 2026-11-09
updated: 2026-11-09
owner: "@deanmarano"
packages:
  - "tse-compiler"
clusters: []
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — tse-compiler (erubi) to parity

## Summary

Close the last erubi gaps in `packages/tse-compiler`, the package that ports
erubi 1.13.1 as trails' template compiler.

## Motivation

Enrollment is done: `vendor-erubi-pair-tse-compiler` and
`tse-compiler-mirror-erubi-files` (0225, done) vendored erubi and paired it with
tse-compiler, and `tse-compiler-erubi-capture-engines` ported the capture
engines. trailmap's "api 0/23, tests 0/39, never enrolled" predates them.
`pnpm parity:api` / `parity:test` on 2026-11-09: erubi api 21/23, tests 38/39 by
file with seven Ruby examples unmatched by name.

## Design

Two stories: the `Buffer` surface, then the eval-only describe, which the
closed `tse-compiler-erubi-capture-block-eval-tests` left for "a tse-compiler
RFC". That story is closed, so its successor is filed here under a new id
rather than reopened across RFCs.

## Non-goals

- **TSE-specific divergences from ERB syntax** (`.tse` delimiters, the stand-in
  harness): those belong to actionview's rendering RFCs.

## Alternatives considered

- **Park the eval describe as `PERMANENT-SKIP`.** Rejected: tse-compiler emits
  JS, so the eval is available; there is no language shortcoming.

## Rollout

1. `erubi-capture-block-buffer`
2. `erubi-capture-block-engine-eval-describe`

## Verification

`pnpm parity:api`: erubi 23/23. `pnpm parity:test`: erubi 100% of Ruby examples
matched by name.

## Open questions

1. **How does `Buffer < ::String` port with no mutable String carrier?**
   Resolved: as a class holding its content, the `OutputBuffer` shape; it is a
   buffer object, not a String carrier.
2. **How does an eval-only erubi test port?** Resolved: evaluate the emitted JS
   and assert on its output.

## Changelog

- 2026-11-09: initial RFC; Open Questions resolved above, so it lands `active`.
