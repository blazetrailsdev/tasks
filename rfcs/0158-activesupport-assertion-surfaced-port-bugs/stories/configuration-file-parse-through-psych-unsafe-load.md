---
title: "configuration-file-parse-through-psych-unsafe-load"
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
  ]
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

`ActiveSupport::ConfigurationFile#parse`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb:21-41`)
reads its YAML through `YAML.unsafe_load_file(@content_path, **options)` /
`YAML.unsafe_load(source, **options)`. trails'
`packages/activesupport/src/configuration-file.ts` `parse` calls the `yaml`
npm package's `parse(source, options)` directly.

`psych-object-protocol-for-record-yaml-round-trip` added Psych's
`unsafeLoad` to `packages/activesupport/src/yaml.ts` (a `ToRuby` visitor over
`yaml.parseDocument`), which surfaced this as a `parity:api:calls` row
(`activesupport configuration-file.ts parse unsafe_load`), carried as
`@missingRailsCall unsafe_load — CONVERGEABLE` on `parse`.

Converging needs `unsafeLoad` to cover what config files rely on and it does
not yet:

- Psych's `<<` merge-key handling in `ToRuby#revive_hash`
  (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/to_ruby.rb:344-380`) —
  `database.yml`'s `<<: *default`.
- the load options `parse` forwards (`symbolize_names:`, `aliases:`, …).
- Psych scalar resolution (`ScalarScanner`) for the plain scalars config files
  hold. Now its own story, `psych-scalar-scanner-tokenize`. Note that Psych
  answers `yes` / `on` as `true` where `yaml.parse` answers a String, so
  converging changes results; the tests should say which answer is Rails'.

## Acceptance criteria

- [ ] `ConfigurationFile#parse` calls `unsafeLoad` (and the `_file` arm) as
      Rails does, and the `@missingRailsCall unsafe_load — CONVERGEABLE` tag
      on it is removed.
- [ ] Existing `configuration-file` tests stay green.

## Home (RFC 0000-psych-in-ruby-compat)

Psych moves out of `packages/activesupport/src/yaml.ts` into
`packages/ruby-compat/src/psych*.ts` (layout: RFC Design §1) in
`move-activesupport-yaml-into-ruby-compat-psych`. Write this story's code there, as `Psych` namespace
members, and not in activesupport.

Also (RFC matrix): `configuration_file.rb:37` rescues `Psych::SyntaxError`
(`psych-syntax-error-and-exception-hierarchy`), and `configuration-file.ts:2`'s
static `from "yaml"` import goes away with this convergence. Two stories depend
on this one: `database-configuration-reads-config-database-yml` and
`config-for-reads-yml-through-configuration-file`.
