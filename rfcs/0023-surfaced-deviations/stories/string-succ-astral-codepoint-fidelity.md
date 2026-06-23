---
title: "stringSucc: increment whole code points (astral chars) in the no-alnum branch"
status: ready
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`stringSucc` (`packages/activesupport/src/range-ext.ts`), the faithful
`String#succ` port added in PR #3948, handles the no-alphanumeric branch by
mapping each char via `Array.from(s, (ch) => ch.charCodeAt(0))` and doing a
raw UTF-16 code-unit increment. For an astral / surrogate-pair character (code
point > 0xFFFF) `charCodeAt(0)` returns only the high surrogate, so the
character is truncated rather than incremented as a whole code point.

Ruby's `String#succ` (string.c `enc_succ_char`) increments by whole encoded
character, so a non-ASCII, non-alnum multibyte char succ-es correctly.

This is irrelevant for the validator inputs Rails string ranges are used with
(ASCII), but it is a real fidelity gap for astral inputs.

## Acceptance criteria

- [ ] `stringSucc` no-alnum branch iterates by code point (e.g. `Array.from`
      yields whole code points; increment the code point, not the surrogate)
      so astral chars round-trip like Ruby `String#succ`.
- [ ] Add a test covering an astral non-alnum char.
