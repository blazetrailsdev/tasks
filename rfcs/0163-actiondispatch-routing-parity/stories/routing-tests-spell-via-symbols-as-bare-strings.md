---
title: "Ported routing tests spell Rails' via: Symbols as bare Strings"
status: draft
updated: 2026-10-02
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails writes a route's `via:` as a Symbol, and the Symbol is observable:
`Journey::Route::VerbMatchers::VERB_TO_CLASS`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/journey/route.rb:41-46`)
keys `"GET"`, `"get"` and `:get` separately and holds `:all` only as a Symbol,
and `Route.verb_matcher` (`:49-53`) sends anything else to
`VerbMatchers::Unknown`. trails ports that table with `":get"` / `":all"` keys
(`packages/actionpack/src/action-dispatch/journey/route.ts:151-160`), so the
repo's Symbol rule (CLAUDE.md, "A Ruby Symbol is a JS string") gives a Rails
`via: :get` the spelling `via: ":get"`.

trails PR 8407 fixed `dispatch/mount.test.ts` (`mount_test.rb:35,47`). The
ported tests below still spell the Symbol as a bare String, which is the value
Rails' `via: "get"` would be, not `via: :get`:

- `dispatch/routing.test.ts:1760,1771` — `routing_test.rb:1886,1895` (`via: :get`)
- `dispatch/mapper.test.ts:83` — `mapper_test.rb:103` (`scope(via: :put)`)
- `action-controller/controller/resources.test.ts:461` —
  `resources_test.rb:1118` (`via: [:get, :post, :put]`); also `:331,335,428`
- `action-controller/controller/integration.test.ts:376,1026`,
  `controller/url-for-integration.test.ts:54`,
  `routing/controller-routing.test.ts:357`, `journey/router.test.ts:544-611`

List them with
`grep -rn 'via: "[a-z]\|via: \["[a-z]' packages/actionpack/src --include=*.test.ts`.

## Acceptance criteria

- Every ported test whose Rails line passes a Symbol (or an Array of Symbols)
  as `via:` passes `":name"` strings; a line Rails writes with a String keeps
  the bare string. Each changed line is checked against its Rails line.
- The tests still pass with no change to `Route.verbMatcher` or
  `VERB_TO_CLASS`.
