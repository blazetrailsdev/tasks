---
title: "solid-cache-bump-to-v1-0-9"
status: claimed
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-16T21:30:06Z"
assignee: "solid-cache-bump-to-v1-0-9"
blocked-by: null
closed-reason: null
---

## Context

`vendor/sources.ts:900` pins solid_cache at `v1.0.7`. `v1.0.9` (7e4bc0cbe2a5) is the latest release. It splits its shared cache behaviors per Rails version into `test/unit/behaviors_rails_7_2/`, `behaviors_rails_8_0/` and `behaviors/`, chosen in `test/unit/behaviors.rb`. Its Rails 8.0 copies match `vendor/rails/v8.0.2/activesupport/test/cache/behaviors/`, which trails' shared activesupport behaviors port. The v1.0.7 copy is an older revision. For example, `local_cache_behavior.rb:217` `test_local_cache_of_fetch_multi` makes 2 `assert_equal` calls, against 3 at Rails `:228`. That difference reds the assertion ratchet on trails#10202, which credits solid_cache's behaviors through the shared activesupport functions.

v1.0.9 also changes `lib/` and `app/`: `install_generator.rb` (+45, plus cache_structure SQL templates), `configuration.rb`, `engine.rb`, `app/models/solid_cache/entry.rb` and `record.rb`. It adds `test/unit/configuration_test.rb`.

## Acceptance criteria

- Bump solid_cache to `v1.0.9` per `vendor/README.md` § "Upgrading a source": ref, lockfile, `vendor:mirrors`, the `vendor:recite` sweep, and body pins re-verified.
- Port the lib/app changes, and `configuration_test.rb`.
- test-compare credits the shared activesupport behaviors to solid_cache's `behaviors_rails_8_0/` copies, the set `behaviors.rb` loads under Rails 8.0.
- `local cache of fetch multi` no longer reds the assertion ratchet.
