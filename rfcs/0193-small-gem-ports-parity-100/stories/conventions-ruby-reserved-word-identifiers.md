---
title: "conventions-ruby-reserved-word-identifiers"
status: ready
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
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

`I18n.translate` (`vendor/i18n/v1.14.8/lib/i18n.rb`, the `translate_key(key, throw, raise, locale, backend, options)` calls) binds the `throw:` kwarg to a local named `throw`. `throw` is a JS reserved word and cannot be a binding name, so `packages/i18n/src/i18n.ts` (`translate`, `translate!`-style call sites at lines ~154-169, ~211-227 and ~333-343) spells it `throwOption`, carrying `@missingRailsName throw` receipts, and four `naming` rows stay in `call-arg-mismatches.json`.

`docs/ruby-ts-conventions.md` (generated from `scripts/parity/conventions.ts`) has no rule for a Ruby identifier that is a JS reserved word, so there is no spelling `parity:api:calls:args` would treat as the same name. Found by `i18n-parity-residual`.

## Acceptance criteria

- [ ] `scripts/parity/conventions.ts` gets a rule for translating a Ruby local/parameter that is a JS reserved word (e.g. a trailing underscore, `throw_`), with the regenerated `docs/ruby-ts-conventions.md`, and the call-args comparator treats that spelling as the Ruby name.
- [ ] `i18n.ts` uses that spelling. The four `translate_key` naming rows and their `throw` receipts are gone.
