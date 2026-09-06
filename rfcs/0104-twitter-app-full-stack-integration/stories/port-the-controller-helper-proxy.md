---
title: "Port ActionController::Helpers#helpers, the controller helper proxy"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The helper proxy — the way Rails reaches helper methods from OUTSIDE a view —
is not ported. Two members, both in
`vendor/rails/actionpack/lib/action_controller/metal/helpers.rb`:

```ruby
# ClassMethods#helpers (helpers.rb:96-100)
def helpers
  @helper_proxy ||= begin
    proxy = ActionView::Base.empty
    proxy.config = config.inheritable_copy
    proxy.extend(_helpers)
  end
end

# Helpers#helpers (helpers.rb:125-127)
def helpers
  @_helper_proxy ||= view_context
end
```

`packages/actionpack/src/action-controller/base.ts:166` already lists
`_helperProxy` in `PROTECTED_IVARS`, so the slot name is reserved and nothing
fills it — the ivar is the only part that exists.

Found while porting the rest of that file in blazetrailsdev/trails#7558. The
pieces it needs are now in place: `ActionView::Base.empty`
(`packages/actionview/src/base.ts`), `viewContext()` on the controller
(`packages/actionpack/src/action-controller/base.ts`), and `_helpers` reaching
a view class through `include()`, which #7558 fixed — the class-level proxy is
`extend(_helpers)`, the same enumeration path that was silently copying nothing
before.

Rails covers all three arms: `test_helper_proxy`, `test_helper_proxy_in_instance`
and `test_helper_proxy_config`
(`vendor/rails/actionpack/test/controller/helper_test.rb:225-274`). Note the
documented caveat Rails carries at helpers.rb:88-95 — the proxy renders under a
different view context, which misbehaves with `capture` — so the port should
keep that behaviour rather than quietly making the two contexts the same.

## Converged shape

`helpers()` as a class method on `ActionController::Base` building
`ActionView::Base.empty`, assigning an inheritable copy of the config, and
extending it with `_helpers`; and `helpers()` as an instance method memoizing
`viewContext()` into the `_helperProxy` slot that already exists.
`config.inheritable_copy` needs checking — if it is unported, either port it or
record what stands in for it at the call site.

## Acceptance criteria

- `ActionController::Base.helpers` and `#helpers` exist at Rails' names, with
  the class-level one memoized per class and the instance one per instance.
- `test_helper_proxy`, `test_helper_proxy_in_instance` and
  `test_helper_proxy_config` are ported under their Rails names.
- The proxy resolves `helper_method`-registered methods and modules included
  via `helper`, exercising the same `_helpers` enumeration #7558 fixed.
