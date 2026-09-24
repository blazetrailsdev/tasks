---
title: "Rename the actionview / actionpack Q predicates (contentFor, inheritViewContextClass, supportsPath, strictLocals, key, routeDefined, …)"
status: in-progress
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["actionview", "actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: 33
pr: trails#8022
claim: "2026-09-23T23:57:04Z"
assignee: "naming-burndown-activerecord-remaining"
blocked-by: null
closed-reason: null
---

## Context

The `Q` predicate spelling is rejected: predicates port as `isX` (or the bare
camel / the quoted literal `"x?"` where a sibling collides), never `xQ`. The
drop-q-predicate-suffix PR removed the `Q` candidate from `rubyMethodToTs`
(`scripts/parity/conventions.ts`), and `parity:api` stopped crediting
`actiondispatch` `route_set.rb` (`key?`, `route_defined?`) and `actionview`
`base.rb` / `rendering.rb` (`xss_safe?`, `changed?`, `inherit_view_context_class?`).

`has*` is a candidate only for a bare predicate that Rails itself aliases to a
`has_*?` method (trails#7981's `HAS_PREDICATE_ALIASES`: `key?` → `hasKey`,
`value?` → `hasValue`). Everything else takes the `is*` / camel / literal
target in the tables below.

This slice covers actionview and actionpack. Several members cross the package
boundary (`inheritViewContextClassQ`, `supportsPathQ`), so the two go in one PR.

| trails                                                                                                                                                             | Rails                                                                                        | target                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `contentForQ` — `packages/actionview/src/helpers/capture-helper.ts:90`, public export `helpers/index.ts:23`                                                        | `content_for?(name)` — `actionview/lib/action_view/helpers/capture_helper.rb:215`            | `isContentFor`                                      |
| `inheritViewContextClassQ` — `actionview/src/rendering.ts:69,85,89`, public export `actionview/src/index.ts:39`; `actionpack/src/action-controller/base.ts:35,227` | `inherit_view_context_class?` — `actionview/lib/action_view/rendering.rb:52`                 | `isInheritViewContextClass`                         |
| `supportsPathQ` — `actionpack/src/abstract-controller/base.ts:86`, `actionview/src/rendering.ts:61,103,125,131,134`                                                | `AbstractController::Base.supports_path?` — `actionpack/lib/abstract_controller/base.rb:200` | `supportsPath` (`supports_*?` keeps the camel form) |
| `strictLocalsQ` — `actionview/src/template.ts:198` (callers `:138,:215,:223,:229,:342,:384`)                                                                       | `Template#strict_locals?` — `actionview/lib/action_view/template.rb:380`                     | `isStrictLocals`                                    |
| `Base.changedQ` — `actionview/src/base.ts:104` (caller `rendering.ts`)                                                                                             | `ActionView::Base.changed?(other)` — `actionview/lib/action_view/base.rb:213`                | `isChanged`                                         |
| `Base.xssSafeQ` — `actionview/src/base.ts:73`                                                                                                                      | `ActionView::Base.xss_safe?` — `actionview/lib/action_view/base.rb:195`                      | `isXssSafe`                                         |
| `NamedRouteCollection#routeDefinedQ` — `actionpack/src/action-dispatch/routing/route-set.ts:299`                                                                   | `route_defined?(name)` — `actionpack/lib/action_dispatch/routing/route_set.rb:97`            | `isRouteDefined`                                    |
| `NamedRouteCollection#keyQ` — `route-set.ts:338`                                                                                                                   | `key?(name)` — `route_set.rb:143`                                                            | `isKey`                                             |

`content_for` and `strict_locals!` sit beside their predicates in Rails, so
the bare camel is taken and the `is*` form is the valid choice. `contentForQ` and
`inheritViewContextClassQ` are **public package exports**, so the rename changes
the public surface too.

Tests: `actionview/src/template/capture-helper.test.ts` (18), `rendering.test.ts`,
`template.test.ts`, `base.test.ts`,
`actionpack/.../routing/named-route-collection.trails.test.ts`.

Prior art: `template-compiled-flag-is-a-container-not-a-boolean` (0140, draft)
touches `changedQ`'s neighbourhood but not the name. Coordinate if it is in flight.

## Acceptance criteria

- No `*Q` identifiers remain in `packages/actionview/src` or
  `packages/actionpack/src` (source or tests). Each member is renamed to its target
  above, public exports included.
- `pnpm parity:api` gets back `route_set.rb` `key?` / `route_defined?`,
  `actionview/base.rb` `xss_safe?` / `changed?` and `rendering.rb`
  `inherit_view_context_class?`, and actiondispatch / actionview coverage does not drop.
- `pnpm parity:api:calls`, `parity:api:calls:args` are green.
