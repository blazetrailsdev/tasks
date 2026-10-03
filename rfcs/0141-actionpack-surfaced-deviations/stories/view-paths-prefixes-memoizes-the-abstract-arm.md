---
title: "actionview: ViewPaths._prefixes memoizes the abstract-superclass arm and guards a missing isAbstract; Rails does neither (view_paths.rb:23-29)"
status: draft
updated: 2026-10-03
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionview/lib/action_view/view_paths.rb:23-29`:

```ruby
def _prefixes # :nodoc:
  @_prefixes ||= begin
    return local_prefixes if superclass.abstract?

    local_prefixes + superclass._prefixes
  end
end
```

The `return` leaves the method before `@_prefixes ||=` assigns, so the abstract-superclass arm is NOT memoized; only the concatenated arm is.

`packages/actionview/src/view-paths.ts` `ClassMethods._prefixes` (after trails#8450) differs in two ways:

- it memoizes both arms into `_prefixesMemo`;
- its abstract test is `!superclass || typeof superclass.isAbstract !== "function" || superclass.isAbstract()` — two arms Rails does not have, there for hosts with no `isAbstract`. Since trails#8450 every controller base class is abstract and carries the class methods through `extend`, so those arms are reachable only from test doubles.

## Converged shape

`return this.localPrefixes()` un-memoized when `superclass.isAbstract()`, the memo only on the concatenated arm, and the guard reduced to `superclass.isAbstract()`. The test doubles in `view-paths.trails.test.ts` get a real abstract superclass.

## Acceptance criteria

- [ ] `_prefixes` has Rails' two arms and memoizes only the second.
- [ ] No `typeof ... isAbstract` or null-superclass arm remains.
- [ ] `pnpm api:calls` stays green; the actionview and actionpack view-path tests pass.
