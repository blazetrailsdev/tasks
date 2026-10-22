---
title: "ConfigurationFile#parse reads YAML through Psych.unsafe_load_file / unsafe_load"
status: ready
updated: 2026-09-29
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps:
  [
    "move-activesupport-yaml-into-ruby-compat-psych",
    "psych-load-file-family",
    "psych-scalar-scanner-tokenize",
    "psych-syntax-error-and-exception-hierarchy",
    "psych-libyaml-seam-without-top-level-await",
  ]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::ConfigurationFile#parse`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb:21-41`)
has two arms: when no ERB was rendered (`source == @content`) it calls
`YAML.unsafe_load_file(@content_path, **options) || {}`, otherwise
`YAML.unsafe_load(source, **options) || {}` (each with a `YAML.load*` fallback
when `unsafe_load` is undefined).

trails' `parse` (`packages/activesupport/src/configuration-file.ts:36-50`)
has one arm: `yamlParse(source, options)`, the `psych-adapter` `parse`
(`packages/ruby-compat/src/psych-adapter.ts:123`, `@noRailsEquivalent
PERMANENT`), which hands the source to the npm `yaml` resolver rather than to
Psych. It carries `@missingRailsCall load — PERMANENT` for the fallback arm.

Every prerequisite this story waited on has landed in RFC 0170: Psych lives in
ruby-compat (trails#8476), `Psych.unsafeLoad` and `Psych.unsafeLoadFile`
exist (`packages/ruby-compat/src/psych.ts:240`, `:380`, trails#8918), the
scalar scanner is ported (trails#8511), and `Psych::SyntaxError` is raised at
every load (trails#8934). `EncryptedConfiguration` already reads through
`Psych.unsafeLoad` (trails#8946). Psych answers `yes` / `on` as `true` where
the npm resolver answers a String, so converging changes results; the tests
should assert Rails' answer.

Two stories depend on this one: `database-configuration-reads-config-database-yml`
and `config-for-reads-yml-through-configuration-file`.

## Acceptance criteria

- [ ] `parse` mirrors `configuration_file.rb:21-41`: the `source == @content`
      arm calls `Psych.unsafeLoadFile(this.contentPath, options)`, the
      rendered arm calls `Psych.unsafeLoad(source, options)`, each `|| {}` with
      Ruby truthiness, and the `Psych.SyntaxError` rescue is unchanged.
- [ ] `configuration-file.ts` no longer imports `psych-adapter`.
- [ ] Existing `configuration-file` tests stay green, and a test pins a
      `<<: *default` merge key and a `yes` scalar to Psych's answers.
