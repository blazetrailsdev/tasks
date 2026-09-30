---
title: "Port Psych.load / Psych.safe_load entry points and their options"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps: ["psych-restricted-class-loader-and-no-alias-ruby"]
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/ruby/v3.3.11/ext/psych/lib/psych.rb:322` `safe_load` (`permitted_classes: []`,
`permitted_symbols: []`, `aliases: false`, `filename:`, `fallback: nil`,
`symbolize_names:`, `freeze:`, `strict_integer:`) and `:368` `load` (the same,
with `permitted_classes: [Symbol]`). `safe_load` builds a
`ClassLoader::Restricted` and, when `aliases: false`, a `NoAliasRuby`
(`psych.rb:323-336`). Both come from
`psych-restricted-class-loader-and-no-alias-ruby`.

Callers: `vendor/rails/v8.0.2/activerecord/lib/active_record/coders/yaml_column.rb:37-41`
(`safe_load(payload, permitted_classes:, aliases: true)`) and
`vendor/rails/v8.0.2/activesupport/lib/active_support/xml_mini.rb:83` (`YAML.load`).

## Acceptance criteria

- [ ] `Psych.safeLoad` and `Psych.load` with the full options bag, camelCased
      (`permittedClasses`, `permittedSymbols`, `aliases`, `filename`,
      `fallback`, `symbolizeNames`, `freeze`, `strictInteger`). `fallback`
      is returned only for an empty document (`psych.rb:324`), and an
      explicitly passed `null` differs from absent.
- [ ] `safeLoad` wires `Restricted` / `NoAliasRuby` exactly as
      `psych.rb:323-336` does. `aliases: false` raises on the first alias, and
      an unpermitted class raises `DisallowedClass`.
- [ ] `symbolizeNames` and `freeze` are honoured (`to_ruby.rb:23`).
- [ ] `psych.trails.test.ts` covers each arm, and README rows are added.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych*.test.ts`.
