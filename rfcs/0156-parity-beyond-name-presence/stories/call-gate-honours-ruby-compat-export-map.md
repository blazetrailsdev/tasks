---
title: "Call gate credits a Ruby call ported as its ruby-compat export"
status: draft
updated: 2026-09-22
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/ruby-compat.ts:97` maps Ruby `Hash#delete` to ruby-compat's `hashDelete`
(receiver `hash`). The call-set gate (`pnpm parity:api:calls`) does not consult that map,
so a TS body that ports `h.delete(k)` as `hashDelete(h, k)` is still reported as omitting
`delete`.

Found in trails#7976: `TestFixtures#accessFixture` (`packages/activerecord/src/test-fixtures.ts`)
ports `@fixture_cache[fs_name].delete(f_name)` (`activerecord/lib/active_record/test_fixtures.rb:307`)
as `hashDelete(...)`, and needed `@missingRailsCall delete — PERMANENT` anyway. The same
receipt covers the JS `delete` operator elsewhere (`migration/command-recorder.ts:149,300`,
`activesupport/src/broadcast-logger.ts:26`). Those are real omissions, which should keep
their receipts, but a `hashDelete` call is not one.

## Acceptance criteria

- The call-set extractor credits a Ruby call as made when the TS body calls the ruby-compat
  export `ruby-compat.ts` maps it to (at least `Hash#delete` → `hashDelete`), honouring the
  receiver kind.
- The `@missingRailsCall delete — PERMANENT` on `accessFixture` goes STALE and is removed.
- A unit test in `scripts/api-compare` covers a mapped call.
