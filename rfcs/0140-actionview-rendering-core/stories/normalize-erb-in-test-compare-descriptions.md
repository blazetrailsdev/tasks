---
title: "normalize-erb-in-test-compare-descriptions"
status: draft
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/compare.ts` carries `normalizeErb` (`:226`), which
lowercases and rewrites `erb` -> `tse` so a renamed trails name still credits
against its Rails original. It is applied to the test CLASS
(`rubyTestClass`, `:237`) and to the TS describe/it PATH (`normPath`, `:275`) —
but the description keys that matching actually runs on are built with plain
`normalize()` on BOTH sides (`:661`, `:732`, `:789`, `:917`, `:960`).

So a Rails test whose DESCRIPTION contains `erb` can never credit. CLAUDE.md
requires the `tse` spelling inside a describe/it string ("trails spells `tse`,
never `erb`, everywhere, including inside a `describe`/`it` string") and states
that `parity:test` normalizes both sides; for descriptions it does not.

Surfaced by #7633, which ports `dependency_tracker_test.rb`. Two of its 25 names
carry `erb` in the description itself and are stranded as missing + extra:

- `test_dependency_of_erb_template_with_number_in_filename`
- `test_dependency_of_erb_template_with_no_spaces_after_render`

trails spells them `dependency of tse template with ...`.

`eslint/rails-test-name-parity.mjs:60` already normalizes `erb` -> `tse` on both
sides for its own matching, so the two tools disagree about the same pair of
names.

## Acceptance criteria

- Description keys in `compare.ts` are built with `normalizeErb` on both the
  Ruby and the TS side, so a `tse`-spelled description credits its `erb`-spelled
  Rails original.
- #7633's two stranded names credit; `template/dependency_tracker_test.rb` goes
  to 21 matched / 4 missing.
- The overall `pnpm parity:test` delta is non-negative for every package, and
  any package whose total moves is named in the PR body (the change can only
  add matches, but it also consumes TS tests that were previously `extra`).
- The assertion ratchet (`pnpm parity:test:assertions`) stays green; newly
  matched tests bring their assertion counts into the comparison for the first
  time, so tighten or baseline with a reviewed reason rather than widening.
- `scripts/test-compare/compare.test.ts` covers a description-level `erb`/`tse`
  pair directly.
