---
title: "Port NumericExtSizeTest to cover the bytes.rb port and its singular aliases"
status: done
updated: 2026-08-12
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6431
claim: "2026-08-12T18:56:50Z"
assignee: "extractor-multi-candidate-call-credits-later-read"
blocked-by: null
closed-reason: null
---

## Context

PR #6428 ported `core_ext/numeric/bytes.rb` to
`packages/activesupport/src/core-ext/numeric/bytes.ts` (19/19 members matched
in `parity:api`), but shipped no test — the story's own table listed the trails
test as "—", and the other three buckets in that PR already had test files to
adopt.

Rails covers it in `NumericExtSizeTest`
(`vendor/rails/activesupport/test/core_ext/numeric_ext_test.rb:105-136`), two
tests:

- `test_unit_in_terms_of_another` — each unit against the next
  (`1024.bytes == 1.kilobyte`), the `1.kilobyte**N` identities up to
  `zettabyte`, and arithmetic across units.
- `test_units_as_bytes_independently` — every method AND its singular alias
  against a literal (`3.megabytes` and `3.megabyte` both `3145728`).

The aliases (`byte`, `kilobyte`, … `zettabyte`) are half the ported surface and
are currently exercised by nothing.

## Converged shape

`packages/activesupport/src/core-ext/numeric/bytes.test.ts` under
`describe("NumericExtSizeTest")` with `it("unit in terms of another")` and
`it("units as bytes independently")` — the `def_test` name mapping, verbatim,
no renames.

The two `exabyte`/`zettabyte` assertions exceed `Number.MAX_SAFE_INTEGER`
(the port's header documents this): assert what a double actually yields, and
pin the precision boundary explicitly so the limit is a tested, visible
property rather than a comment. Do NOT loosen the other assertions to
accommodate it.

## Acceptance criteria

- [ ] `bytes.test.ts` exists with both Rails test names, mapped verbatim.
- [ ] Every method and every singular alias is asserted.
- [ ] `pnpm parity:test` delta non-negative; the file is enrolled if
      `test:compare` enrollment is required for it.
