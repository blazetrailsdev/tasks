---
title: "Mapper#match fans out one Route per verb where Rails builds one"
status: ready
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 180
priority: 41
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `match` builds ONE `Mapping` for a multi-verb `via:` and calls
`@set.add_route(mapping, as)` exactly once
(`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:2043-2062`).
The whole `via` array is folded into a single route's verb matcher by
`Mapping.build` → `@via.map { |m| Journey::Route.verb_matcher(m) }`
(`mapper.rb:208`), so `match "/search", via: [:get, :post], as: "search"` is one
named `Journey::Route` answering both verbs.

trails' `Mapper#match`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts:669-679`) instead
fans out one `Route` per verb:

```ts
methods.forEach((method, i) => {
  this.addRoute(method, path, i === 0 ? options : { ...options, as: null, name: null });
});
```

so the same call produces TWO `Route` objects. `Route#verb` is a single string
(`routing/route.ts`), which is what forces the fan-out.

Surfaced in PR #7611, which ported `RouteSet#addRoute`'s duplicate-name
`ArgumentError` (`route_set.rb:648-655`). That guard fired on the second verb
arm, because both arms carried `as: "search"`. #7611 worked around it by
suppressing the name on arms after the first — itself a faithful port of Rails'
`as: nil`/`false` suppression (`mapper.rb:2052-2053`) — but the fan-out itself
is untouched and is the actual deviation.

## Acceptance criteria

- [ ] `Mapper#match` calls `addRoute` once per `match`, whatever the `via:`
      arity, matching `mapper.rb:2043-2062`.
- [ ] A route carries a verb MATCHER built from the whole `via` array
      (`mapper.rb:208`, `Journey::Route.verb_matcher`), not a single verb
      string, so recognition of every listed verb goes through one route.
- [ ] The name-suppression arm added by #7611 for arms >= 1 is removed with the
      fan-out it existed to serve; Rails' `as: nil`/`false` suppression
      (`mapper.rb:2052-2053`) stays, since that is a real Rails behaviour.
- [ ] `routing.test.ts`'s "match with multiple via" and `journey/routes_test.rb`
      parity stay green.
