---
title: "application.ts.tt: port the dummy_app load_defaults VERSION.to_f arm"
status: blocked
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10692
claim: "2026-11-24T02:59:56Z"
assignee: "activestorage-index-import-loads-blob-eagerly"
blocked-by: "needs operator ruling: Trails.VERSION.STRING is 0.1.0.alpha0.1, so to_f is 0.1 and loadDefaults has no 0.1 arm (Rails gets 8.0); trails#10692 review"
closed-reason: null
---

## Context

`vendor/rails/v8.0.5.2/railties/lib/rails/generators/rails/app/templates/config/application.rb.tt:10-15`
writes `config.load_defaults Rails::VERSION::STRING.to_f` when `options.dummy_app?`,
and `build(:config_target_version)` otherwise. trails'
`packages/trailties/lib/generators/trails/app/templates/config/application.ts.tt:25`
has only the second arm, so a plugin's dummy app pins a literal version.
Converging also needs `Configuration#loadDefaults`
(`packages/trailties/lib/application/configuration.ts:146`) to accept a Float:
its `switch (String(targetVersion))` renders `8.0` as `"8"`, where Ruby's
`case target_version.to_s` gives `"8.0"`.

## Acceptance criteria

- [ ] `application.ts.tt` ports the `dummyApp` arm, emitting the `Trails.VERSION.STRING.to_f` equivalent.
- [ ] `loadDefaults` renders a Float target as Ruby's `Float#to_s` does (`8.0` → `"8.0"`).
- [ ] `plugin_generator_test.rb:616` "dummy application uses dynamic rails version number" is ported and passes.
