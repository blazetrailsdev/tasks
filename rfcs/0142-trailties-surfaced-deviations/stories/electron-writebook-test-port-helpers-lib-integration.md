---
title: "test port helpers lib integration for the Writebook example"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: ["electron-writebook-test-port-fixtures-and-models"]
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

Writebook (vendored at `vendor/writebook/v1.2.9`) ships Minitest tests under `test/`. `examples/electron-writebook` (trails#10716) ports the app but only carries a few invented integration tests. Port each Rails test with its name verbatim (`test "x"` → `it("x")`, file `foo_test.rb` → `foo.test.ts` at the same path under `examples/electron-writebook/test/`), asserting what Rails asserts.

Files:

- `test/channels/application_cable/connection_test.rb`
- `test/helpers/pages_helper_test.rb`
- `test/helpers/searches_helper_test.rb`
- `test/integration/content_security_policy_test.rb`
- `test/integration/routes_test.rb`
- `test/lib/markdown_renderer_test.rb`
- `test/lib/redis_cache_store_test.rb`
- `test/lib/vips_loader_policy_test.rb`
- `test/middleware/uploaded_script_guard_test.rb`

## Acceptance criteria

- Each listed test is ported with its verbatim name and passes, or is `it.skip` naming a filed story. `redis_cache_store_test.rb` and `vips_loader_policy_test.rb` cover Writebook's deployment (Redis, libvips); where the example does not port that code, record the omission in the README instead.
