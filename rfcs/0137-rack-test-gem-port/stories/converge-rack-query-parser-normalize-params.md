---
title: "converge-rack-query-parser-normalize-params"
status: done
updated: 2026-09-05
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 15
pr: 7529
claim: "2026-09-05T17:58:56Z"
assignee: "port-rack-test-methods"
blocked-by: null
closed-reason: null
---

## Context

`packages/rack/src/query-parser.ts:179-224`'s `_normalizeParams` is not a port of
Rack's `Rack::QueryParser#_normalize_params`
(`vendor/rack/lib/rack/query_parser.rb:196-250`) — it is a rewritten
regex-and-loop implementation that splits the whole name into brackets up front
(`query-parser.ts:189,204,222`) instead of Ruby's recursive one-segment-at-a-time
`k` / `after` split.

The rewrite diverges on repeated `[]` segments, which is Ruby's
`after.start_with?('[]')` arm (`query_parser.rb:229-243`) — the arm that appends
into `params[k].last` when that last element is a hash that does not yet have the
child key, and pushes a fresh hash otherwise. Two shapes it gets wrong, both
found while porting `Rack::Test::Utils.build_multipart`
(`vendor/rack-test/lib/rack/test/utils.rb:34`), whose bodies trails now emits
byte-identically to the gem:

- `foo[][id]=2`, `foo[][data][]=3`, `foo[][data][]=4` parses to
  `{"id" => "2", "data" => ["3"]}` — the second `foo[][data][]` is dropped —
  where Ruby gives `"data" => ["3", "4"]`.
- `foo[bar][][id]`, `foo[bar][][name]`, `foo[bar][][qux][][id]`,
  `foo[bar][][qux][][name]` (two outer hashes, the second carrying two nested
  ones) parses to a five-element `bar` array where Ruby gives two.

Verified against the gem with `ruby -Ilib -e 'require "rack/test"; ...'` from
`vendor/rack-test/`.

Three `Rack::Test::Utils.build_multipart` cases are `it.skip`ped on this in
`packages/rack-test/src/utils.test.ts` ("builds nested multipart bodies with
arbitrarily nested array of hashes", "allows for nested files", "allows for
forcing multipart uploads even without a file"), each carrying a
`// BLOCKED: converge-rack-query-parser-normalize-params` comment. Unskip them
as part of this story.

`normalize_params`' `ParameterTypeError` raise sites (`query_parser.rb:238,246`)
and its `params_hash_type?` / `params_hash_has_key?` helpers
(`query_parser.rb:252-258`) are part of the body and come with it. The parser is
on every request path in the repo, so expect fallout in
`packages/rack/src/query-parser.test.ts` and `multipart.test.ts` — that fallout
is the point: a test asserting the rewritten behaviour is asserting the
divergence.

## Acceptance criteria

- [ ] `_normalizeParams` mirrors `_normalize_params`
      (`vendor/rack/lib/rack/query_parser.rb:196-250`) branch for branch: the
      `depth == 0` / `[]` / `[` / malformed `k`/`after` split, then the
      `after == ''`, `'['`, `'[]'`, `start_with?('[]')` and hash arms in Ruby's
      order, recursing rather than pre-splitting the whole name.
- [ ] `paramsHashType` and `paramsHashHasKey` exist at their Rails names.
- [ ] The two shapes above parse as the gem does.
- [ ] The three `it.skip`s in `packages/rack-test/src/utils.test.ts` are unskipped
      and pass, and their `BLOCKED:` comments are gone.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; both call gates green.
