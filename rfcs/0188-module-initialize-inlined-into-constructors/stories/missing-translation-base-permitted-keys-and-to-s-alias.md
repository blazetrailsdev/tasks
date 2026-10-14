---
title: "i18n: MissingTranslation::Base owns PERMITTED_KEYS and aliases to_s to message"
status: draft
updated: 2026-10-14
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`I18n::MissingTranslation::Base` (`vendor/i18n/v1.14.8/lib/i18n/exceptions.rb:47-81`) holds `PERMITTED_KEYS = [:scope, :default].freeze` as a constant of the module (`:48`) and ends with `alias :to_s :message` (`:81`). In `packages/i18n/src/exceptions.ts` (after trails#8888 made `Base` a `Module`), `PERMITTED_KEYS` is a module-level `const`, not a constant of `Base`, and `to_s` is a separate `toString()` method body returning `this.message` rather than an alias of the same function.

## Acceptance criteria

- `PERMITTED_KEYS` is seated on `Base` as its constant (e.g. `rbModConstSet(Base, "PERMITTED_KEYS", …)` or the settled module-constant shape), and the two inlined constructor bodies read it from there.
- `toString` is the same function as the `message` reader (the JS spelling of `alias`), not a second body; `parity:api` is not worse.
