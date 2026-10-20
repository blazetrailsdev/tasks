---
title: "i18n-core-string-helpers-move-to-ruby-compat"
status: draft
updated: 2026-10-20
rfc: "0120-extra-surface-gating-rollout"
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

Found auditing i18n's `@noRailsEquivalent` receipts while enrolling i18n in the
extra-surface gate (`burn-down-and-enroll-i18n`, RFC 0120).

Two i18n exports stand in for Ruby core methods, not for anything the i18n gem
defines:

- `tr` (`packages/i18n/src/backend/flatten.ts:30`) is `String#tr`, called at
  `vendor/i18n/v1.14.8/lib/i18n/backend/flatten.rb` (`escape_default_separator`,
  `normalize_flat_keys`) and `backend/base.rb` (`load_file`'s `type.tr('.', '')`).
- `toSym` (`packages/i18n/src/i18n.ts:294`) is `String#to_sym` / `Symbol#to_sym`
  under the repo's ":name" Symbol convention.

Both were tagged `@noRailsEquivalent PERMANENT`, but a Ruby core method has a
home: ruby-compat (`rb_str_tr`, `rb_str_intern` in `vendor/ruby/v3.3.11/string.c`).
Neither is a TypeScript language shortcoming, so both are now
`CONVERGEABLE` against this story.

## Acceptance criteria

- ruby-compat exports the MRI-cited port (`rbStrTr`, and the to_sym form the
  Symbol convention needs) per its README rules; i18n calls it.
- `tr` and `toSym` are deleted from i18n along with their receipts; i18n's
  extra-surface `allowed` mark is tightened down.
