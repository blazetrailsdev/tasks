---
title: "Application#config_for: add Rails' <name>.yml arm; receipt the .ts/.js arms"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["trailties"]
deps: ["configuration-file-parse-through-psych-unsafe-load"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/application.rb:288-312`: `config_for(name, env:)`
reads `"#{paths["config"].existent.first}/#{name}.yml"` (or a `Pathname`)
through `ActiveSupport::ConfigurationFile.parse(yaml).deep_symbolize_keys`, and
raises "Could not load configuration. No such file - #{yaml}". trails
(`packages/trailties/src/application.ts:281-315`) accepts only `<name>.ts` /
`.js` modules, and its error message names `.ts`.

`deep_symbolize_keys` on an option hash is omitted per RFC 0149 (bare keys).

## Acceptance criteria

- [ ] A `<name>.yml` arm is added in Rails' place, with the `shared`
      deep-merge and the `OrderedOptions` wrap unchanged (`:297-307`). The
      error message is Rails' own, naming the `.yml` path when no arm matches.
- [ ] The `.ts` / `.js` arms carry `@noRailsEquivalent PERMANENT` receipts.
- [ ] Ported `config_for` tests from `vendor/rails/v8.0.2/railties/test/application/configuration_test.rb`
      (grep `config_for`) run against `.yml` fixtures, and the TS arm keeps
      its trails tests.

## Verification

`pnpm vitest run packages/trailties/src/application/configuration.test.ts`.
