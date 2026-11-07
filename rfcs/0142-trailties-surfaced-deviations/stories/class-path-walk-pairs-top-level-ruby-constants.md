---
title: "class-path-walk-pairs-top-level-ruby-constants"
status: closed
updated: 2026-11-07
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: a top-level Ruby constant needs no table row (its JS name is its Ruby path); class-paths' receipt demand now skips it in trails#9812"
---

# Pair top-level Ruby constants in the class-path walk (DummyConfig)

## Context

`vendor/rails/v8.0.2/railties/lib/rails/application/dummy_config.rb:3` defines `class DummyConfig` at the
top level, not under `Rails::Application`. `rails-api.json` records it as `DummyConfig`, but
`scripts/api-compare/class-paths.ts` derives the TS path `Trails::Application::DummyConfig` from
`packages/trailties/src/application/dummy-config.ts`. The two never pair (`constantResidue`,
`class-paths.ts:578-601`), so `--check --record` lists the class under trailties' `excluded` in
`scripts/api-compare/constant-residue.json`, and `unreceiptedExclusions` (`class-paths.ts:659`) demands a
`@noRailsEquivalent` receipt for a class that does have a Rails counterpart. trails#9812 carries
`@noRailsEquivalent CONVERGEABLE <this story>` on `DummyConfig` until this lands.

## Acceptance criteria

- [ ] The walk pairs a TS class with a Ruby constant defined at top level in the mirrored `.rb`
      file (here `DummyConfig`), and seats it in `constants.generated.ts` as `"DummyConfig"`.
- [ ] `application/dummy-config.ts::DummyConfig` leaves trailties' `excluded` list, and the
      `@noRailsEquivalent` receipt on `DummyConfig` is deleted.
