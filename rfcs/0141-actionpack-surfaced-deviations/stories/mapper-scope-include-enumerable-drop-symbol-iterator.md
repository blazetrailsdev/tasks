---
title: "Mapper::Scope includes Enumerable; shallowNestingDepth uses find_all; drop [Symbol.iterator]"
status: in-progress
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8241
claim: "2026-09-29T15:30:30Z"
assignee: "ar-new-project-fails-its-own-typecheck"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mapper::Scope` does `include Enumerable` over its `each`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:2365-2373`), and
`Mapper::Resources#shallow_nesting_depth` (`mapper.rb:1859-1863`) reads the chain
through it:

```ruby
@scope.find_all { |node| node.frame[:scope_level_resource] }
      .count { |node| node.frame[:scope_level_resource].shallow? }
```

trails#8179 ported `Scope#each` into `routing/mapper.ts`, but kept
`[Symbol.iterator]` (a `@noRailsEquivalent PERMANENT` delegate to `each`) because
`shallowNestingDepth` spreads `[...this._scope]` and uses `Array#filter`.
ruby-compat's `Enumerable` (`packages/ruby-compat/src/enumerable.ts`) ports only
`map`, `first` and `any?` so far.

## Acceptance criteria

- Port `Enumerable#find_all` (`vendor/ruby/v3.3.11/enum.c` `enum_find_all`) into
  ruby-compat's `Enumerable`, with its `@noRailsEquivalent PERMANENT` receipt.
- `include(Scope, Enumerable)` in `routing/mapper.ts`, as `mapper.rb:2365` does.
- `shallowNestingDepth` reads `this._scope.findAll(...)` and then counts, the
  way `mapper.rb:1859-1863` does.
- `Scope[Symbol.iterator]` and its receipt are deleted.
