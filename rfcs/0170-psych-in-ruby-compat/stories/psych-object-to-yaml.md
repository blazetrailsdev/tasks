---
title: "Port Object#to_yaml (psych/core_ext.rb) as ruby-compat toYaml"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps: ["move-activesupport-yaml-into-ruby-compat-psych"]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/ruby/v3.3.11/ext/psych/lib/psych/core_ext.rb:12-14`: `def to_yaml(options = {}) Psych.dump(self, options) end`.
Callers: `vendor/rails/v8.0.2/actionview/lib/action_view/helpers/debug_helper.rb:30`,
`vendor/rails/v8.0.2/activesupport/lib/active_support/xml_mini.rb:62`,
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/devcontainer/devcontainer_generator.rb:149`,
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/db/system/change/change_generator.rb:144`,
and the `to_yaml` tests (`relations_test.rb:79-82`,
`hash_with_indifferent_access_test.rb:871-883`).

## Acceptance criteria

- [ ] `toYaml(o, options = {})` lives in `ruby-compat/src/psych/core-ext.ts` and
      calls `Psych.dump(o, options)`.
- [ ] `scripts/parity/ruby-compat.ts` `RUBY_COMPAT_EXPORTS` gains
      `["Object#to_yaml", "toYaml"]`, so the call gate credits it.
- [ ] Tests and README rows are added.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych*.test.ts scripts/parity`.
