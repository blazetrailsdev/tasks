---
title: "rack-middleware-spec-tail-remainder-takes-rails-bodies"
status: in-progress
updated: 2026-10-23
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9275
claim: "2026-10-23T16:19:36Z"
assignee: "blocklocator-locate-many-filters-nils"
blocked-by: null
closed-reason: null
---

## Context

`rack-middleware-spec-tail-takes-rails-bodies` shipped the first seven files
from its table (`show_exceptions`, `auth_basic`, `sendfile`, `urlmap`,
`show_status`, `cascade`, `conditional_get`). After that, `pnpm parity:test --package rack --assertions` reports
0 count, kind and value mismatches for those seven. That PR was already past the LOC
ceiling, so this story takes the remainder of the same table. Rails bodies are at
`vendor/rack/v3.1.14/test/spec_<name>.rb`.

| Ruby spec                 | count | kind | value | TS-only |
| ------------------------- | ----: | ---: | ----: | ------: |
| `spec_method_override.rb` |     2 |    2 |     2 |       1 |
| `spec_events.rb`          |     2 |    2 |     0 |       0 |
| `spec_recursive.rb`       |     1 |    3 |     0 |       0 |
| `spec_lock.rb`            |     0 |    3 |     0 |       0 |
| `spec_head.rb`            |     1 |    2 |     0 |       0 |
| `spec_null_logger.rb`     |     1 |    1 |     0 |       0 |
| `spec_etag.rb`            |     0 |    1 |     0 |       0 |
| `spec_common_logger.rb`   |     0 |    1 |     0 |       0 |
| `spec_utils.rb`           |     0 |    0 |     1 |       3 |

It also covers the TS-only extras in Rails-named files `media-type.test.ts` (2),
`version.test.ts` (2), `mock-request.test.ts` (1) and `query-parser.test.ts` (1).

The idioms the first PR settled: `res.must_be :ok?` is
`expect(res.isOk).toBeTruthy()`, `res.wont_be_empty` is
`expect(res).not.toBeEmpty()` (`@blazetrails/vitest-matchers`),
`headers.wont_include k` is `expect(Object.keys(headers)).not.toContain(k)`,
`str.must_be :empty?` is `expect(str.length === 0).toBeTruthy()`, and the app
is wrapped in `new Lint(...)` as Rails does.
`spec_common_logger.rb`'s `(0..1).must_include duration` may be a comparer
mapping gap. If so, file a script story for it.

## Acceptance criteria

- [ ] Each file above takes the Rails spec bodies, with test names unchanged.
- [ ] `pnpm parity:test --package rack --assertions` reports 0 count, kind and
      value mismatches for every file in the table.
- [ ] The 10 TS-only tests in Rails-named files move to `*.trails.test.ts` or
      are deleted.
