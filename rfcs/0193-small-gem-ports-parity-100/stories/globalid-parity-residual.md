---
title: "globalid residual: GlobalID#app/#find, two inheritance gaps, uri/gid call rows, locator argument row, pin"
status: ready
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: small-residuals
packages: [globalid]
deps:
  [
    globalid-map-railtie-test-onto-trailtie,
    burn-down-and-enroll-globalid,
    rails-test-name-parity-rollout-globalid,
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `global_id.rb` is 19/21: instance `GlobalID#app` and `#find` (`vendor/globalid/v1.3.0/lib/global_id/global_id.rb:52`) are missing. See `globalid-find-class-method-missing`.
- Inheritance: `GlobalID::Locator::InvalidModelIdError < StandardError` (`locator.rb:5`) has no TS class, and `URI::GID < URI::Generic` (`uri/gid.rb:7`) does not extend ruby-compat's `URI::Generic`.
- Call rows (`call-mismatches-exclude/globalid/uri/gid.json`): `set_model_components` omits `validate_model_id`, and `validate_app` omits `parse`.
- Argument row: `locate_many_signed` passes `filter` where Rails passes `compact` (receipted). See `locate-many-signed-passes-uris-not-sgids`.
- Tests: the 7 missing `railtie_test.rb` tests are `globalid-map-railtie-test-onto-trailtie` (deps). The 47 TS-only extras are `rails-test-name-parity-rollout-globalid` (deps). Extra surface (4 novel: `BadURIError`, `InvalidComponentError` in `uri/gid.ts`, `getApp`/`setApp`) is owned by `burn-down-and-enroll-globalid` (0120, deps).
- Pins: 64/65.

## Acceptance criteria

- [ ] globalid 91/91 methods, inheritance 5/5, and pins 0 unpinned.
- [ ] The `uri/gid.json` shard is deleted and tightened, and 0 globalid rows remain in either output with no receipt left on `locateManySigned`.
- [ ] 138/138 tests with 0 TS-only tests in Rails-named files, and `parity:api:extra --package globalid` 0 novel / 0 moved (both delivered by the deps stories; this story closes only after them).
