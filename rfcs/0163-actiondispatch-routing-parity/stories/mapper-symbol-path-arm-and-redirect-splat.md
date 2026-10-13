---
title: "Mapper: map_match's Symbol-path arm and redirect's splat (two skipped TestRoutingMapper tests)"
status: claimed
updated: 2026-10-13
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-13T21:12:25Z"
assignee: "activerecord-test-case-remaining-members"
blocked-by: null
closed-reason: null
---

## Context

Two `TestRoutingMapper` tests in
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts` stay
`it.skip` on these mapper gaps, found while porting
`port-routing-test-mapper-skips-part-1`.

**A Symbol path with `path:`.** `test_path_option_override`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb:1032-1049`) draws
`put :close, on: :member, path: "fechar"`. Rails' `map_match`
(`actionpack/lib/action_dispatch/routing/mapper.rb:1962-2006`) groups its paths
by class: a String path with a String `:path` raises "Ambiguous route
definition" (`:1991-1997`), and a Symbol path is the action, sent to
`decomposed_match(action, controller, route_options, option_path, ...)`
(`:2000-2003`). trails' `mapMatch` (`routing/mapper.ts`) has only the String
arm, so `this.put("close", { on: "member", path: "fechar" })` raises the
ambiguity error. A Ruby Symbol whose Symbol-ness decides control flow keeps its
colon (root CLAUDE.md, "A Ruby Symbol is a JS string"), so the port is
`this.put(":close", ...)` with a Symbol arm in `mapMatch`.

**`redirect(*args, &block)`.** `test_redirect_with_complete_url_and_status`
(`routing_test.rb:1719-1726`) draws
`redirect("http://www.google.com/", status: 302)`. Rails' `Redirection#redirect`
(`actionpack/lib/action_dispatch/routing/redirection.rb:204-215`) takes a splat
and extracts the options. `Mapper#redirect` (`routing/mapper.ts`) takes one
argument and drops the second, so the status stays 301. `redirection.ts`'s
`redirect` already takes the splat; `Redirection` is a module Rails includes
into `Mapper`, so the wrapper in `mapper.ts` is the deviation.

## Acceptance criteria

- [ ] `mapMatch` has Rails' `path_types[Symbol]` arm, and `path option override`
      is un-skipped with the Rails body.
- [ ] `Mapper` gets `redirect` from the `Redirection` module with no wrapper,
      and `redirect with complete url and status` is un-skipped with the Rails
      body.
