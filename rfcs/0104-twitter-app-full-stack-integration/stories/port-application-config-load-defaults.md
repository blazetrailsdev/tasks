---
title: "Port Configuration#loadDefaults and emit config.loadDefaults from trails new"
status: claimed
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: ["generate-app-subclassing-application"]
deps-rfc: []
est-loc: 200
priority: 36
pr: null
claim: "2026-09-01T17:23:54Z"
assignee: "scopes-are-untyped-on-relation"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Application::Configuration#load_defaults` is not ported
(`packages/trailties/src/application/configuration.ts:1-4` says so explicitly:
"scalar/state defaults only — `loadDefaults(version)` version-dispatch ... are
2.5c or later").

Rails: `railties/lib/rails/application/configuration.rb:70` (`def load_defaults(target_version)`)
— a version-dispatch chain (`case target_version.to_s ... when "7.1" ... when "7.2"`)
that flips per-version framework defaults.

Because it is absent, `trails new` deliberately omits Rails'
`config.load_defaults <version>` from the generated `config/application.ts`
(`railties/lib/rails/generators/rails/app/templates/config/application.rb.tt:11-15`),
which is the FIRST line of every real Rails app class. See PR #6534.

## Converged shape

Port `loadDefaults(targetVersion)` onto `Configuration` with the same
version-dispatch branch order and the same per-version assignments as
`configuration.rb:70`, then emit `config.loadDefaults("<version>")` from the
`trails new` application template (`packages/trailties/src/generators/app-generator.ts`,
`createConfigFiles`) as Rails' template does.

## Acceptance criteria

- `Configuration#loadDefaults` exists with Rails' branch order and assignments.
- The generated `src/config/application.ts` calls it, and the generator
  snapshot is updated.
- The PR-body omission note for `load_defaults` is removed from the record.
