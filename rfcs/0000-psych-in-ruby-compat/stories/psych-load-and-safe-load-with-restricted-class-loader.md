---
title: "Port Psych.load / Psych.safe_load with ClassLoader::Restricted and NoAliasRuby"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps: ["move-activesupport-yaml-into-ruby-compat-psych"]
deps-rfc: []
est-loc: 350
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
with `permitted_classes: [Symbol]`). `ClassLoader::Restricted`
(`psych/class_loader.rb:76-101`) raises `DisallowedClass("load", name)`
(`psych/exception.rb:23-26`). `NoAliasRuby` (`psych/visitors/to_ruby.rb:430`)
raises `AliasesNotEnabled` (`exception.rb:10-14`). `AnchorNotDefined`
(`:17-21`) covers an undefined alias.

Callers: `vendor/rails/v8.0.2/activerecord/lib/active_record/coders/yaml_column.rb:37-41`
(`safe_load(payload, permitted_classes:, aliases: true)`) and
`vendor/rails/v8.0.2/activesupport/lib/active_support/xml_mini.rb:83` (`YAML.load`).

## Acceptance criteria

- [ ] `Psych.safeLoad` and `Psych.load` with the full options bag, camelCased
      (`permittedClasses`, `permittedSymbols`, `aliases`, `filename`,
      `fallback`, `symbolizeNames`, `freeze`, `strictInteger`). `fallback`
      is returned only for an empty document (`psych.rb:327-330`), and an
      explicitly passed `null` differs from absent.
- [ ] `Psych.ClassLoader` and `Psych.ClassLoader.Restricted`: a permitted class
      matches by the name `rbModName` answers, and Symbols by
      `permittedSymbols`. A Ruby Symbol is a `":name"` string (CLAUDE.md).
- [ ] `BadAlias`, `AliasesNotEnabled` and `AnchorNotDefined` exist with Ruby's
      messages. `aliases: false` raises on the first alias.
- [ ] `symbolizeNames` and `freeze` are honoured (`to_ruby.rb:23`).
- [ ] `psych.trails.test.ts` covers each arm, and README rows are added.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych*.test.ts`.
