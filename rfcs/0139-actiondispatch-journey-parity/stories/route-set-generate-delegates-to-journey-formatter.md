---
title: "route-set-generate-delegates-to-journey-formatter"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
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
closed-reason: null
---

## Context

Rails builds `UrlGenerationError`'s message in `Journey::Formatter::MissingRoute#message`
from `constraints`, which `Formatter#generate` computes as
`path_parameters.merge(options)` — the FULL recall-plus-options hash
(`vendor/rails/actionpack/lib/action_dispatch/journey/formatter.rb:69`). So
`journey/router_test.rb`'s `test_generate_missing_keys_no_matches_different_format_keys`
(`vendor/rails/actionpack/test/journey/router_test.rb:270-293`) asserts a message
naming every request parameter:

    No route matches {:action=>"show", "action"=>"show", :controller=>"tasks",
      :id=>1, :name=>"task_1", :relative_url_root=>nil}, missing required keys: [:name]

trails ships the correct `MissingRoute#message` shape as of #<this PR>, but the
raise site is `Route#pathFor`
(`packages/actionpack/src/action-dispatch/routing/route.ts`), reached from
`RouteSet#generate`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts:729-753`), which
hands `pathFor` only the parameterized parts — not the constraints hash. The
message therefore reads

    No route matches {:action=>"show", :controller=>"tasks"}, missing required keys: [:name]

`Journey::Formatter` already exists at
`packages/actionpack/src/action-dispatch/journey/formatter.ts` with a faithful
`generate` and the right constraints; `RouteSet#generate` simply does not route
through it, so it also re-implements route selection by hand rather than using
`Formatter#match_route`'s scoring.

## Acceptance criteria

- [ ] `RouteSet#generate` delegates to `Journey::Formatter#generate`, mirroring
      `route_set.rb`'s `@set.formatter.generate(...)`, so the constraints hash in
      the message is `path_parameters.merge(options)`.
- [ ] The hand-rolled route-selection `find` in `RouteSet#generate` and
      `generateExtras` goes away in favour of the formatter's cache/score walk.
- [ ] `journey/router.test.ts`'s `generate missing keys no matches different format keys`
      asserts the whole Rails constraints hash instead of the narrowed one it
      pins today.
- [ ] `pnpm parity:test --package actiondispatch` non-regressing.
