---
title: "rails-error-parity bare-throw burndown (continue 5): i18n.ts + lint.ts"
status: ready
updated: 2026-07-14
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follows RFC 0025 bare-throw burndown continue-4 (PR #4856), which cleared
`serialization.ts` and `attribute.ts`. Remaining bare-throw activemodel files in
`eslint/rails-error-parity-exclude.json` that need a ported-class judgment call:

- `i18n.ts` line ~143 `"Translation missing: ..."` — Rails' I18n raises
  `I18n::MissingTranslationData` (i18n gem, not an activemodel manifest class).
  Pick/port a defensible class.
- `lint.ts` — many throws port Rails' `ActiveModel::Lint::Tests` Minitest
  `assert*` failures; no Rails error class exists (Minitest::Assertion). Decide
  a class for assertion-style failures.

Ported root classes live in `attribute-assignment.ts` (ArgumentError/TypeError/
NameError/NoMethodError/NotImplementedError/RuntimeError); reuse or extend that
home.

## Acceptance criteria

- [ ] Convert all bare throws in `i18n.ts` and `lint.ts` to manifest-correct
      ported classes; remove both from the exclude baseline.
- [ ] `pnpm lint` passes, rule stays `error`, baseline strictly smaller.
- [ ] Touched tests green; api:compare/test:compare delta non-negative; <500 LOC.
