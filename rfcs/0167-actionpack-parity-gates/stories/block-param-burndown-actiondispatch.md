---
title: "Burn actiondispatch's block-parameter mismatches to zero"
status: ready
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
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

`scripts/api-compare/block-param-mark.json` holds actiondispatch at 35 block-parameter mismatches, and `output/block-param-mismatches.json` on trails `main` @ `87094a5097` lists them:

- `routing/mapper.rb` (20): `Mapper#match`/`Resources#match` and the `HttpHelpers` verbs `get`, `post`, `patch`, `put`, `delete`, `options`, `connect`, `map_method`, each recorded under both `Mapper` and its module, plus `CustomUrls#resolve`/`direct`
- `middleware/stack.rb` (5): `MiddlewareStack#unshift`, `insert`, `insert_after`, `swap`, `use`
- `testing/integration.rb` (3): `#initialize` on `IntegrationTest`, `Integration::Runner` and `IntegrationTest::Behavior`
- one each: `Http::Headers#fetch`, `QueryParser#each_pair`, `Response::FileBody#each`, `Journey::Formatter#match_route`, `Journey::Router#find_routes`, `Cookies::CookieJar#fetch`, `ExceptionWrapper#causes_for`

The marks for actioncontroller (2, `metal/strong_parameters.rb`) and abstractcontroller (3, `rendering.rb`) did not show in this output. RFC 0127's `block-param-marks-left-above-their-measurement` owns re-reading those marks.

## Acceptance criteria

- Each row's TS method takes the block parameter Rails declares (`&block` / `yield`), or the row is shown to be an extractor false positive and fixed in `lint-block-params` / the extractors.
- The actiondispatch mark is tightened to 0 with `pnpm parity:api:blocks:tighten`, and so are actioncontroller and abstractcontroller if their measurements are 0.
