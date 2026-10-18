---
title: "Port activerecord multifetch_cache_test.rb and relation_cache_test.rb"
status: in-progress
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9037
claim: "2026-10-18T18:14:53Z"
assignee: "actionview-helpers-umbrella-eager-load-and-final-sweep"
blocked-by: null
closed-reason: null
---

## Context

RFC 0176 is the ActionView closer: actionview test parity is 1051/2562 (41%) at trails `94b071b93d`
(`pnpm parity:test --package actionview`). These Rails test files have missing tests and no open story:

| Rails test file                                                             | Rails tests | Matched | Missing | trails file                                                           |
| --------------------------------------------------------------------------- | ----------- | ------- | ------- | --------------------------------------------------------------------- |
| `vendor/rails/v8.0.2/actionview/test/activerecord/multifetch_cache_test.rb` | 3           | 0       | 3       | `packages/actionview/src/activerecord/multifetch-cache.test.ts` (new) |
| `vendor/rails/v8.0.2/actionview/test/activerecord/relation_cache_test.rb`   | 1           | 0       | 1       | `packages/actionview/src/activerecord/relation-cache.test.ts` (new)   |

Uses the AR test models; ride the canonical schema and fixtures.

## Acceptance criteria

- [ ] Every missing test in the files above is ported at the convention path, with the Rails test name verbatim.
- [ ] A test whose subject is unported either drives the port in this PR or is filed as a story naming the method it waits on, with this story's tests parked as `it.skip` pointing at it.
- [ ] Permanently unportable arms are parked as `it.skip` under a `PERMANENT-SKIP:` line citing the ratified CLAUDE.md section.
- [ ] `pnpm parity:test --package actionview` shows the missing count above go to zero for these files.
