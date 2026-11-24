---
title: "trailties-test-configuration-config-for-yaml"
status: claimed
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-24T17:56:59Z"
assignee: "trailties-test-configuration-config-for-yaml"
blocked-by: null
closed-reason: null
---

## Context

Three tests in `vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb`
exercise YAML-only behaviour of `config_for`:

- `:2687` "config_for containing ERB tags should evaluate" (`<%= %>` in custom.yml)
- `:2698` "config_for with syntax error show a more descriptive exception"
  (`ActiveSupport::ConfigurationFile.parse` rescuing `Psych::SyntaxError` →
  "YAML syntax error occurred while parsing")
- `:2723` "config_for handles YAML patches (like safe_yaml) that disable the
  symbolize_names option" (`YAML.stub :load`)

trails' `Application#configFor` (`packages/trailties/lib/application.ts:515-548`)
reads `config/<name>.ts` / `.js` modules through `loadIseqEval`, never YAML, so
none of the three has a direct counterpart, and no CLAUDE.md section ratifies
config files being TS modules (the fixtures section in
`packages/activerecord/CLAUDE.md` covers fixtures only). The rest of the
config_for tests were ported against `.ts` config files.

## Acceptance criteria

- [ ] Operator decision recorded: either `configFor` also reads
      `config/<name>.yml` through `ActiveSupport::ConfigurationFile.parse`
      (then port the three tests verbatim), or config files are TS modules by
      ratified CLAUDE.md section (then park the three as `it.skip` under a
      `PERMANENT-SKIP:` line naming it).
- [ ] No Miss left for `configuration_test.rb:2687`, `:2698`, `:2723`.
