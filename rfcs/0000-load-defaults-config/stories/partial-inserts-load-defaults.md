---
title: "Establish config.load_defaults + land partial_inserts as the 7.0 entry"
status: claimed
updated: 2026-06-09
rfc: "0000-load-defaults-config"
cluster: config-defaults
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: null
claim: "2026-06-09T19:45:28Z"
assignee: "partial-inserts-load-defaults"
blocked-by: null
---

## Context

First story of the RFC: build the minimal versioned-defaults substrate and use it
to wire `partial_inserts` correctly. On `main`, `activerecord/src/trailtie.ts`
wires several `config.activeRecord` flags but **no `partialInserts`**, and there
is no `loadDefaults` mechanism. `Base.partialInserts` keeps Rails' framework
default `true` (`dirty.rb:49-50`); the test env forces `false` directly in
`test-setup-ar.ts`, so a real consuming app gets `true` with no path to flip it.

See this RFC's §Design.

## Acceptance criteria

- A versioned framework-defaults table exists, keyed by version string, with a
  `"7.0"` entry that sets `partialInserts: false` (matching Rails
  `config.load_defaults 7.0`, which flips `partial_inserts` false while
  `partial_updates` stays true).
- `config.load_defaults(version)` (on the trailtie / application configuration)
  applies every entry up to and including `version` onto `ActiveRecord.Base`,
  mirroring Rails' `Configuration#load_defaults`.
- `test-setup-ar.ts` consumes `load_defaults("7.0")` (or the app-equivalent)
  instead of setting `Base.partialInserts = false` directly.
- An app that does not call `load_defaults` keeps `partial_inserts = true` (Rails'
  pre-7.0 framework default); one that calls `load_defaults("7.0")` gets `false`.
- Tests cover both: default-true (no `load_defaults`) and false-after-`7.0`; the
  existing dirty/partial-insert suites stay green with the test env on the new
  path.
- `pnpm tsc --build` clean; touched test files only.

## Notes

Keep the table seeded with only the `7.0`/`partial_inserts` entry — do not
speculatively add empty version rows (see RFC Open question 1). The counter-cache
canonical-column DB-default fix and other framework flags are explicit follow-ons
(RFC §Rollout), not part of this story.
