---
title: "ActionController::Base's constructor cannot carry @inlinedFrom ActionView::Rendering#initialize: the comparer pairs no Rails initialize"
status: ready
updated: 2026-10-12
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8824. `ActionView::Rendering#initialize`
(`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb:32-35`) is
`@_rendered_format = nil` then `super`. `ActionController::Base` reaches it
through `ActionView::Layouts`, so the body is inlined in `Base`'s constructor
(`packages/actionpack/src/action-controller/base.ts`), with `super()` hoisted.

The constructor carries no `@inlinedFrom` tag, because the tooling cannot pair
one there. With
`@inlinedFrom ActionView::Rendering#initialize rails/v8.0.2/actionview/lib/action_view/rendering.rb:32-35`
on it:

- `pnpm parity:api --calls` throws from `scripts/api-compare/compare.ts`
  (`@inlinedFrom was never compared, no Rails initialize paired:
actioncontroller/base.ts Base#constructor, actioncontroller/index.ts
Base#constructor`), which takes both call gates down with it.
- `pnpm parity:api:inlined` reports `sits on a constructor whose file and name
mirror no Rails class or module` for the same two rows
  (`scripts/api-compare/lint-inlined-from.ts`).

`action_controller/base.rb` defines no `initialize` of its own, and the module
lives in another gem, so neither the pairing nor the counterpart lookup finds
a row for the constructor.

## Acceptance criteria

- The comparer pairs an `@inlinedFrom` on a constructor whose Rails class
  defines no `initialize` of its own, including a module from another gem
  reached through a transitive `include`.
- `Base`'s constructor carries the tag above, and `pnpm parity:api:calls`,
  `pnpm parity:api:calls:args` and `pnpm parity:api:inlined` are green.
- The other module `initialize` bodies `ActionController::Base` reaches are
  inventoried, and each is inlined with its tag or filed.
