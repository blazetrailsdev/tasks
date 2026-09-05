---
title: 'Route#verb carries an "ALL" sentinel where Journey::Route#verb is verbs.join("|")'
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Journey::Route#verb` is `verbs.join("|")`
(`vendor/rails/actionpack/lib/action_dispatch/journey/route.rb:191`), where
`verbs` comes from the route's `VerbMatchers`
(`vendor/rails/actionpack/lib/action_dispatch/journey/route.rb:16-27`). A route
drawn `via: :all` matches every verb, so `verbs` is empty and `verb` is `""` —
which is why `bin/rails routes` prints a blank Verb column for a `mount`
(`vendor/rails/actionpack/test/dispatch/routing/inspector_test.rb:226-246`).

trails' `Route.verb` (`packages/actionpack/src/action-dispatch/routing/route.ts`)
is a single string that carries the sentinel `"ALL"` for that case rather than a
verb list. PR #7520 had to translate at the display edge —
`RouteWrapper#verb` (`packages/actionpack/src/action-dispatch/routing/inspector.ts`)
answers `route.verb === "ALL" ? "" : route.verb` — to make Rails'
`test_rails_routes_shows_overridden_named_route_with_mounted_rack_app_with_name`
pass.

That leaves the sentinel visible everywhere else `route.verb` is read, and
`RouteWrapper#isMatchesFilter` already carries its own `"ALL" ? "GET"`
translation for the same reason.

## Converged shape

`Route` carries the verb list Rails carries, and `verb` is `verbs.join("|")`
(`journey/route.rb:191`), so `via: :all` yields `""` at the source rather than
at each reader. The two sentinel translations in `inspector.ts` are deleted.

## Acceptance criteria

- [ ] `Route#verb` derives from a verb list and answers `""` for a route drawn
      `via: :all`, matching `journey/route.rb:191`.
- [ ] `RouteWrapper#verb` reads `route.verb` unmodified and
      `RouteWrapper#isMatchesFilter`'s `"ALL"` arm is gone.
- [ ] `inspector.test.ts`'s mounted-rack-app tests stay green.
