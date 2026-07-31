---
title: "Guard the ESLint and shell control-byte sets against drift"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5714
claim: "2026-07-31T15:39:02Z"
assignee: "control-byte-guards-drift-between-eslint-and-shell"
blocked-by: null
closed-reason: null
---

## Context

PR #5699 added `scripts/ci/check-control-bytes.sh`, the non-JS/TS half of the
`blazetrails/no-raw-control-bytes` ESLint rule. The two enforce the same byte
set — C0 except tab/LF/CR, plus DEL and C1 — but express it twice, in two
different alphabets:

- `eslint/no-raw-control-bytes.mjs:21` matches decoded UTF-16 codepoints:
  `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/gu`
- `scripts/ci/check-control-bytes.sh:4` matches raw bytes under `LC_ALL=C`, so
  C1 has to be re-encoded as UTF-8: `[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]|\xC2[\x80-\x9F]`

Nothing enforces that they stay equivalent. The script's own `usage()` text
says "keep the two byte sets in step", which is a comment, not a gate: widening
one (say, to cover U+FEFF or the Unicode line separators) silently leaves the
other narrower, and the resulting hole is exactly the silent-wrong-answer
failure mode both guards exist to prevent. The re-encoding step makes hand
comparison non-obvious — a reviewer has to know that bare `[\x80-\x9F]` would
false-positive on UTF-8 continuation bytes before they can confirm the two
agree.

Precedent for this shape of guard: `eslint/rails-private-jsdoc.config.test.mjs`
is a drift guard between `eslint.config.mjs` and the standalone
`eslint/rails-private-jsdoc.config.mjs`.

## Acceptance criteria

- A test asserts the two byte sets are equivalent, deriving both from their
  real sources rather than restating either — e.g. read `CONTROL_RE` out of
  `scripts/ci/check-control-bytes.sh`, decode the UTF-8-encoded C1 branch back
  to codepoints, and compare the resulting codepoint set against the ESLint
  rule's regex over the full 0x00-0xFF range.
- The test fails when either side is edited alone (verify by mutating each
  in turn).
- It runs in a CI job that already covers `eslint/` — `eslint/` is in
  `UNIT_TESTS_PKGS_RE` in `.github/workflows/ci.yml`; `scripts/ci/` is not, so
  either place the test under `eslint/` or extend that gate regex.
