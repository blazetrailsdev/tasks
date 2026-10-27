---
title: "i18n-backend-fallbacks-is-a-class-factory-not-a-module"
status: draft
updated: 2026-10-27
rfc: "0142-trailties-surfaced-deviations"
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

`I18n::Backend::Fallbacks` (`vendor/i18n/v1.14.8/lib/i18n/backend/fallbacks.rb`) is a
module that `I18n::Railtie.include_fallbacks_module`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/i18n_railtie.rb:110-112`) mixes
into the live backend's class: `I18n.backend.class.include(I18n::Backend::Fallbacks)`.

trails ports it as a class factory, `Fallbacks(Superclass)` returning
`abstract class Fallbacks extends Superclass` (`packages/i18n/src/backend/fallbacks.ts:37-44`).
A class factory can only be applied where a class is defined, so there is no way to
write `include_fallbacks_module` against an existing backend class, and
`i18n-railtie-initializers-unported` (RFC 0142) cannot port `init_fallbacks`
faithfully until this converges.

## Acceptance criteria

- `Backend::Fallbacks` is a plain-object module (CLAUDE.md, "A Ruby module is a JS
  object or a JS class") whose `translate` / `exists` / … reach the backend's own
  method through `rbCallSuper`, so `include(backend().constructor, Fallbacks)` works
  on a class that already exists.
- Existing `Fallbacks(...)` call sites and tests are converted.
