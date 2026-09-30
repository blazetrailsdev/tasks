---
title: "activerecord: TestFixtures#method_missing / respond_to_missing? — decide and port the 'nothing' row"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: skips
packages: ["activerecord"]
deps: ["activerecord-unexclude-and-measure-fixtures-rb"]
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

CLAUDE.md's `method_missing` table records `active_record/test_fixtures.rb | nothing`, and says a
"nothing" row with a dispatch-dependent Rails test is a gap. `TestFixtures#method_missing`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:276`) and `respond_to_missing?` (:284) answer fixture accessors
(`topics(:first)`) that `setup_fixture_accessors` did not define, and `fixtures_test.rb` exercises the
path. trails' fixture accessors are generated functions, so an accessor for a set added after setup is
unreachable.

## Acceptance criteria

- [ ] The row is decided per class as CLAUDE.md requires: a Proxy or typed-accessor carrier for `TestFixtures`, with the CLAUDE.md table row updated in the same PR.
- [ ] The `fixtures_test.rb` cases that go through the dispatch pass with Rails' bodies.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins && pnpm vitest run scripts/parity/conventions.test.ts
```
