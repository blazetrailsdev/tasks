---
title: "Call-order gate pairs Scope#get (Ruby []) with Mapper's routing get"
status: done
updated: 2026-10-17
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9014
claim: "2026-10-17T23:18:48Z"
assignee: "call-order-gate-pairs-scope-get-with-routing-get"
blocked-by: null
closed-reason: null
---

## Context

`Mapper::Resources#resource` / `#resources`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1355-1370`,
`:1530-1545`) read `@scope[:shallow]` while building the resource, and later call
`new do get :new end`. `Scope#[]` (`mapper.rb`) is ported as `Scope#get`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`), so the TS body's
`this._scope.get("shallow")` records a call named `get` ahead of `constructor`. The Ruby
extractor records no call for the `[]` operator, so the order gate pairs that `get` with
Rails' routing `get :new` and reports `order:get,constructor → constructor,get` for both
methods. The bodies are in Rails' order; the two rows in
`scripts/api-compare/call-mismatches-exclude/actiondispatch/routing/mapper.json` are a
comparer homonym.

A blanket TS-extractor rule that drops every `x.get("<literal>")` from the call stream
would move call sets repo-wide, so the fix needs the receiver: `_scope` is a `Scope`,
whose `get` is the port of `[]` (`OPERATOR_SPELLING_BY_FQN` in
`scripts/api-compare/operator-order-spelling.ts` already records per-class `[]`
spellings for the method-order manifest).

## Acceptance criteria

- The call-order comparison does not position a TS call that ports a Ruby operator
  (`[]` → `get`) as the Ruby method of the same name.
- The `resource` and `resources` `order:get,constructor` rows are deleted from the
  baseline and `pnpm parity:api:calls` is green, with no other row moving.
