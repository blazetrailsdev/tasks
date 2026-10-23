---
title: "Fold i18n's resetConfig/resetClassConfig test seams into I18n.config= assignment"
status: draft
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

Two i18n test seams carry `@noRailsEquivalent CONVERGEABLE` receipts that named
no story until `convergeable-tag-story-id` (RFC 0120) required one:

- `packages/i18n/src/i18n.ts` `resetConfig()` — sets the `:i18n_config`
  thread variable to `null` and clears `normalizedKeyCache`.
- `packages/i18n/src/config.ts` `resetClassConfig()` — resets the module-level
  `backend`, `defaultLocale`, `availableLocales`, `availableLocalesSet`,
  `defaultSeparator` and `exceptionHandler` bindings.

Ruby's suite resets by assigning a fresh `I18n.config`
(`vendor/i18n/v1.14.8/lib/i18n.rb` `config=`, `vendor/i18n/v1.14.8/lib/i18n/config.rb`): the
class-level state (`@@backend`, `@@default_locale`, …) and the normalized-key
cache are both reached from there. In trails the class-level slots are module
bindings and the key cache is module-global, so a fresh `Config` reaches
neither, which is why the two seams exist.

## Acceptance criteria

- The normalized-key cache and the class-level slots are reached the way Ruby
  reaches them, so assigning a fresh config (`setConfig(new Config())`) resets
  what `resetConfig` / `resetClassConfig` reset today.
- `resetConfig` and `resetClassConfig` are deleted, and their test callers
  reset through `setConfig`.
- Their `@noRailsEquivalent CONVERGEABLE` receipts go with them;
  `pnpm parity:api:extra --package i18n` shows no new extra.
