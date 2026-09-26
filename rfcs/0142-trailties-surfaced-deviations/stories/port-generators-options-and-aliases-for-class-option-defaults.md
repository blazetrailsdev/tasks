---
title: "port-generators-options-and-aliases-for-class-option-defaults"
status: ready
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Rails::Generators::Base.class_option`
(`railties/lib/rails/generators/base.rb:217-222`) fills `:aliases` and `:default`
from `default_aliases_for_option` / `default_value_for_option`
(`base.rb:351-373`), which read `Rails::Generators.options` and
`Rails::Generators.aliases` keyed by `generator_name`, then `base_name`, then
`:rails` — so `config.generators { |g| g.orm ... }` reaches every declared
option's default.

trails' `GeneratorBase.classOption` (`packages/trailties/src/generators/base.ts`)
ports only the `:desc` line. `Generators.options` / `Generators.aliases`,
`generator_name`, `base_name` and `default_for_option` are unported, so the two
calls are omitted outright (the call gate does not flag them because the
callees are unported).

## Acceptance criteria

- `Generators.options` / `Generators.aliases` (`generators.rb`) are ported.
- `defaultValueForOption`, `defaultAliasesForOption`, `defaultForOption` are
  ported on `GeneratorBase` and `classOption` calls both, as `base.rb:219-220` do.
