---
title: "actionview/actionpack: a controller's local_prefixes override is never dispatched, and no controller base class is abstract (view_paths.rb:23-29,72-77)"
status: draft
updated: 2026-10-03
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionview", "actionpack"]
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

`vendor/rails/v8.0.2/actionview/lib/action_view/view_paths.rb:23-29` and `:72-77`:

```ruby
def _prefixes # :nodoc:
  @_prefixes ||= begin
    return local_prefixes if superclass.abstract?

    local_prefixes + superclass._prefixes
  end
end

private
  # Override this method in your controller if you want to change paths prefixes for finding views.
  # Prefixes defined here will still be added to parents' <tt>._prefixes</tt>.
  def local_prefixes
    [controller_path]
  end
```

Both are class methods every controller has, and both are dispatched on the class, so a controller that overrides `local_prefixes` changes where its views are looked up — and nothing else: `controller_path`, which routes and `ActionController::TestCase` read, is untouched. Rails tests it (`actionview/test/actionpack/abstract/abstract_controller_test.rb:165-195`, "overriding .local_prefixes adds prefix", ".local_prefixes is inherited").

trails cannot honour the override, for two reasons:

- `packages/actionview/src/view-paths.ts` `ClassMethods._prefixes` calls `ClassMethods.localPrefixes.call(this)` and `ClassMethods._prefixes.call(superclass)` — the framework's own functions, never the class's — and `ActionController::Base` (`packages/actionpack/src/action-controller/base.ts`) copies `viewPaths`, `appendViewPath`, `prependViewPath` and `_viewPaths` onto itself but neither `_prefixes` nor `localPrefixes`, so a controller has no `localPrefixes` to override.
- Nothing in trails is abstract. Rails declares `abstract!` on `AbstractController::Base` (`abstract_controller/base.rb:143`), `ActionController::Metal` (`action_controller/metal.rb:122`) and `ActionController::Base` (`action_controller/base.rb:208`); trails defines `abstractBang` and never calls it. So `superclass.abstract?` is never true and a controller's prefixes run `["rfc_pages", "application", "base", "metal", null]` where Rails gives `["rfc_pages", "application"]`.

Found from trailmap, which wants kebab-case view directories (`app/views/rfc-pages/`). It first overrode `controllerPath`, which also names the controller in routes and broke `ActionController::TestCase` (a hyphen is not a legal controller name there); `local_prefixes` is the hook Rails documents for exactly this.

## Converged shape

`_prefixes` is `this.localPrefixes()` and `superclass._prefixes()`, as `view_paths.rb:23-29`. `ActionController::Base` carries `_prefixes` and `localPrefixes` as class methods. The three base classes are declared abstract in their class bodies, as Rails does.

## Acceptance criteria

- [ ] A controller overriding `localPrefixes` renders from the prefix it names, and subclasses inherit the override.
- [ ] `controllerPath` is unchanged by such an override.
- [ ] `AbstractController::Base`, `ActionController::Metal` and `ActionController::Base` are abstract; a controller under `ApplicationController` has prefixes `[own, "application"]`.
- [ ] Porting the two Rails tests under their Rails names waits on `abstract_controller_test.rb`, which has no trails port; it is not in scope here.
