---
title: "actionpack: controller-routing.test.ts's TS-only tests move to a .trails sibling"
status: in-progress
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8891
claim: "2026-10-14T11:33:03Z"
assignee: "controller-routing-test-ts-only-tests-move-to-trails-sibling"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/routing/controller-routing.test.ts`
has a test named "match with multiple verbs" (`:354-358`) that draws
`this.match("/login", { to: "sessions#create", via: ["get", "post"] })`. No
Rails test draws that route: a grep of `vendor/rails/v8.0.2/actionpack/test`
for `sessions#create` with a `via:` finds nothing, so trails#8867 could not
check its `via:` against a Rails line and left it as written.

A TS-only test belongs in a `.trails.test.ts` sibling, and a test in a
Rails-matched file should have a Rails counterpart. Rails writes a multi-verb
`via:` as Symbols (`match "/match" => "books#get_or_post", :via => [:get, :post]`,
`vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb:877`), which
trails spells `[":get", ":post"]`
(`packages/actionpack/src/action-dispatch/journey/route.ts:151-160`).

## Acceptance criteria

- [ ] Each test in `controller-routing.test.ts` with no Rails counterpart is
      found with `pnpm parity:test --extra` and moved to a `.trails.test.ts`
      sibling, or deleted where a ported Rails test already covers it.
- [ ] A moved test that passes `via:` passes `":name"` strings.
