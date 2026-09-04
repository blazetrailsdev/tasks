---
title: "Template#compile!'s @compiled is a boolean, not the container it compiled into"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Template#compile!` (`vendor/rails/actionview/lib/action_view/template.rb:418-438`)
memoizes with a plain boolean:

```ruby
def compile!(view)
  return if @compiled
  @compile_mutex.synchronize do
    return if @compiled
    mod = view.compiled_method_container
    instrument("!compile_template") { compile(mod) }
    @compiled = true
  end
end
```

The boolean is sound in Rails because a `Template` object belongs to exactly
one `compiled_method_container` for its lifetime.

trails ships a deviation at
`packages/actionview/src/template.ts` (`compileBang`): `_compiled` holds the
`CompiledMethodContainer` the method was defined on, and the early return is
`if (this._compiled === mod) return;`. A trails resolver's template cache
outlives the view-context class that `LookupContext#buildViewContext` memoizes
(`packages/actionview/src/lookup-context.ts`), so the same `Template` can be
rendered against two `withEmptyTemplateCache` subclasses; Rails' boolean would
then hand `Base#_run` a `method_name` the second container has never defined.

This is a caching-lifetime divergence, not a language shortcoming — it is
convergeable by fixing which cache owns what, and should not be left as a
permanent shape.

## Converged shape

Give the template cache and the view-context class the same lifetime, so one
`Template` only ever meets one container, then narrow `_compiled` back to
Rails' boolean. Rails gets this from `Base.changed?(other)`
(`base.rb:212-214`, ported at `packages/actionview/src/base.ts`), which
`LookupContext` uses to clear its template cache when the view-context class
changes; trails never calls it.

Relates to [[unify-lookup-context-resolver-protocols]].

## Acceptance criteria

- `Template#_compiled` is a boolean and `compileBang`'s early return is
  `if (this._compiled) return;`, matching `template.rb:420`.
- `LookupContext` clears its template cache when its view-context class
  changes, via `Base.changedQ` (`base.rb:212-214`).
- The existing test "gives two withEmptyTemplateCache containers separate
  compiled methods" (`packages/actionview/src/template.test.ts`) still passes,
  or is replaced by one that pins the Rails-shaped invalidation.
