---
title: "Deprecation#initialize takes positional (deprecationHorizon, gemName) with Rails' defaults"
status: done
updated: 2026-08-09
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6276
claim: "2026-08-09T02:45:47Z"
assignee: "migration-context-collaborator-readers-cast-away-the-null-object"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `Deprecation::Deprecators` in PR #6256, which needed
`gemName` and so read `Deprecation#initialize` closely.

Rails (`activesupport/lib/active_support/deprecation.rb:65-79`):

```ruby
attr_accessor :deprecation_horizon

def initialize(deprecation_horizon = "8.1", gem_name = "Rails")
  self.gem_name = gem_name
  self.deprecation_horizon = deprecation_horizon
  self.silenced = false
  self.debug = false
  @silence_counter = Concurrent::ThreadLocalVar.new(0)
  @explicitly_allowed_warnings = Concurrent::ThreadLocalVar.new(nil)
end
```

Two positional parameters, both with defaults, and the horizon is named
`deprecation_horizon`.

trails (`packages/activesupport/src/deprecation.ts`):

```ts
constructor(options?: { horizon?: string; gemName?: string; silenced?: boolean })
```

Three divergences:

1. **Shape.** Rails' positionals became a kwargs-style options object. Rails
   has no kwargs here, so there is no kwarg idiom to appeal to — this is an
   invented signature, and it is why `parity:api` reports the constructor's
   arity against a 2-positional Ruby method.
2. **Defaults dropped.** `deprecationHorizon` and `gemName` are left
   `undefined` where Rails defaults them to `"8.1"` and `"Rails"`. Every
   trails `deprecator.ts` passes `gemName` explicitly, so nothing observes the
   gap today, but a bare `new Deprecation()` diverges from Rails.
3. **Name.** `horizon` is not the Ruby name — `attr_accessor
:deprecation_horizon` (`deprecation.rb:65`) camelizes to
   `deprecationHorizon`. `pnpm parity:api:extra --package activesupport` currently
   reports `horizon` as novel surface on `deprecation.ts` for exactly this
   reason.

There is also a stray `silenced?: boolean` option with no Rails counterpart —
Rails sets `self.silenced = false` unconditionally and callers assign
afterwards.

## Converged shape

```ts
constructor(deprecationHorizon = "8.1", gemName = "Rails") { ... }
```

with `horizon` renamed to `deprecationHorizon` and the `silenced` option
dropped (callers assign `d.silenced = true` after construction, as Rails does).
Update the ~6 construction sites (`packages/{actionview,activemodel,activerecord}/src/deprecator.ts`
plus `deprecation.test.ts` / `hwia-module-string.test.ts`) to the positional
form. The `_silenceCounter` / `_allowContexts` initializers already mirror
`deprecation.rb:78-79`.

## Acceptance criteria

- [ ] The constructor takes `(deprecationHorizon = "8.1", gemName = "Rails")`
      positionally (`deprecation.rb:71`).
- [ ] `horizon` is renamed `deprecationHorizon` (`deprecation.rb:65`) and
      leaves `parity:api:extra`'s novel list for `deprecation.ts`.
- [ ] The invented `silenced` constructor option is gone.
- [ ] All construction sites updated; `deprecation.rb`'s arity mismatch clears
      in `pnpm parity:api --arity`.
