---
title: "Consolidate activemodel/activerecord i18n shims"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: ["i18n-consolidate-activesupport-shim"]
deps-rfc: []
est-loc: 500
pr: 6026
claim: "2026-08-03T20:58:28Z"
assignee: "i18n-consolidate-activemodel-activerecord-shims"
blocked-by: null
closed-reason: null
---

# Consolidate activemodel/activerecord i18n shims onto @blazetrails/i18n

## Context

- `packages/activemodel/src/i18n.ts` (381 lines) — second divergent backend +
  `MissingInterpolationArgument` (`:29-40`), used by
  `packages/activemodel/src/translation.ts` (`human_attribute_name`,
  mirrors `vendor/rails/activemodel/lib/active_model/translation.rb:80`) and
  the error-message chains mirroring
  `vendor/rails/activemodel/lib/active_model/error.rb:58,86,100`.
- `packages/activerecord/src/translation.ts` — `i18n_scope :activerecord` +
  lookup ancestry, mirrors
  `vendor/rails/activerecord/lib/active_record/translation.rb`.
- `packages/activesupport/src/html-safe-translation.ts` — mirrors
  `vendor/rails/activesupport/lib/active_support/html_safe_translation.rb`.

The Rails-side files above call the real gem; after this story trails does
too, and the `activerecord.errors.models.*` /
`activemodel.errors.messages.*` default chains are exercised against one
backend. Depends on the activesupport consolidation story.

## Acceptance criteria

- `packages/activemodel/src/i18n.ts`'s backend and exception classes are
  deleted; activemodel/activerecord translation code calls
  `@blazetrails/i18n` with the same defaults-chain construction as Rails.
- `generate_message`, `full_message`, `human_attribute_name`,
  `model_name.human` behavior unchanged: existing AM/AR tests pass with
  names untouched.
- Any deliberate deviation is justified at the call site (comment), not in
  the PR body.
