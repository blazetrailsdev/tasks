---
title: "mapper-resources-resource-class-carries-param-and-as"
status: done
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8891
claim: "2026-10-14T11:33:03Z"
assignee: "controller-routing-test-ts-only-tests-move-to-trails-sibling"
blocked-by: null
closed-reason: null
---

## Context

trails' `Mapper#resources` / `#resource` (`packages/actionpack/src/action-dispatch/routing/mapper.ts:960-985`, `:1100-1110`) build an inline `ResourceLike` literal with `param: "id"` and `nestedParam` (`${singular}_id`) hard-coded, and ignore `as:`. Rails builds `Mapper::Resources::Resource` / `SingletonResource` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1175-1300`), whose `initialize` reads `options[:param]` (raising `ArgumentError, ":param option can't contain colons"` at `:1178-1179`), sets `@param = (options[:param] || :id).to_sym` (`:1192`), and `@as = options[:as]`, which `name` / `member_name` / `collection_name` read.

Five TestRoutingMapper ports stay `it.skip` with their Rails bodies in `packages/actionpack/src/action-dispatch/dispatch/routing.test.ts` until this lands: "custom param", "custom param constraint", "colon containing custom param", "shallow custom param" (`routing_test.rb:3435-3495`), and "resource where as is empty" (`routing_test.rb:3764-3775`).

## Acceptance criteria

- `Resource` and `SingletonResource` are ported in `mapper.ts` at their Rails names, and `resources` / `resource` construct them instead of the inline literal.
- `param:` and `as:` behave as in Rails; the colon guard raises Rails' error and message.
- The five tests above run (no `it.skip`) and pass.
