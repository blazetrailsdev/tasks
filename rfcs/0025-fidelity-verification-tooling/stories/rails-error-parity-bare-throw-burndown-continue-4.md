---
title: "rails-error-parity-bare-throw-burndown-continue-4"
status: claimed
updated: 2026-07-13
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-13T21:32:36Z"
assignee: "rails-error-parity-bare-throw-burndown-continue-4"
blocked-by: null
closed-reason: null
---

# rails-error-parity bare-throw burndown (continue 4)

## Context

Continues the `blazetrails/rails-error-parity` bare-throw burndown (RFC 0025),
following PRs #3250, #3374, #3916 and continue-3. continue-3 cleared the
Rails-confirmed slice of `activemodel/src/` non-validator files:
`type/registry.ts` (→ `ArgumentError`), `type/value.ts` (→ `NoMethodError`),
`validator.ts` (→ `ArgumentError` + newly ported `NotImplementedError`),
`model.ts` and `serializers/json.ts` (`fromJson` → `TypeError`). It ported
`NotImplementedError` into `packages/activemodel/src/attribute-assignment.ts`
alongside `ArgumentError`/`TypeError`/`NameError`/`NoMethodError`.

Remaining `activemodel/src/` files still in
`eslint/rails-error-parity-exclude.json`, each deferred because the mapping
needs a judgment call or a larger refactor:

- `serialization.ts` — 3 throws are Ruby `NoMethodError` (`"undefined method
'...' for an instance of ..."`, lines ~216/523 and the `:methods` guard ~88),
  clean to convert. BUT line ~105 (unloaded-collection sync-serialization
  guard) is a trails-invented runtime error with no Rails equivalent — needs a
  ported `RuntimeError` (Ruby root base, not yet ported) or another agreed
  class. All throws in the file must be converted together to un-exclude it.
- `errors.ts` — no bare throws, but un-excluding activates the parity check,
  which requires an exported class **literally named `RangeError`** (manifest:
  `RangeError < ::RangeError`, active_model/errors.rb:523). Ours is named
  `ActiveModelRangeError` and is imported under that name across ~15
  activerecord files + tests. Renaming to `RangeError` (import-aliased at every
  use site to dodge the global collision) is a cross-package rename — likely a
  standalone PR.
- `attribute.ts` — line ~229 is a trails-invented module-load-order guard
  (`UserProvidedDefault not loaded`); no Rails equivalent. Needs a ported
  `RuntimeError` or agreed class.
- `i18n.ts` — line ~143 `"Translation missing: ..."`; Rails' I18n raises
  `I18n::MissingTranslationData` (i18n gem, not an activemodel manifest class).
  Pick a defensible ported class.
- `lint.ts` — many throws port Rails' `ActiveModel::Lint::Tests` Minitest
  `assert*` failures; no Rails error class exists (Minitest::Assertion). Decide
  a class for assertion-style failures.

## Acceptance criteria

- [ ] A coherent slice of the remaining files removed from
      `eslint/rails-error-parity-exclude.json`, each banned bare throw replaced
      by the manifest-correct ported class (port `RuntimeError` if the
      trails-invented-guard mapping is agreed; do the `RangeError` rename in its
      own PR).
- [ ] `pnpm lint` passes with a strictly-smaller baseline (rule stays `error`).
- [ ] Touched test files stay green; api:compare/test:compare delta
      non-negative.
- [ ] PR under 500 LOC; any further remainder registered as a continuation
      story.
