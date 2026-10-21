---
title: "actionpack: route-set url/path helper modules without live include"
status: ready
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["actionpack"]
deps:
  - actionpack-module-super-inlined-into-includers
deps-rfc: []
est-loc: 250
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These actionpack sites define methods on a module after a class includes it (RFC 0197 § "Methods defined after inclusion"). `actionpack-module-super-inlined-into-includers` left them "for the owner", and no story tracked them. On origin/main (2026-10-21):

- `action-dispatch/routing/route-set.ts:543-544` `pathHelpersModule` / `urlHelpersModule`: named-route helpers are added after the modules are included (`actionpack/lib/action_dispatch/routing/route_set.rb:85-120`, `NamedRouteCollection#define_url_helper`).
- `route-set.ts:327` `MountedHelpers` and `route-set.ts:810` (the `url_helpers` module built by `generate_url_helpers`).
- `abstract-controller/trailties/routes-helpers.ts` reads a `Module`'s method table.

`lazy-route-set-url-helpers-without-splice` depends on this: `method_missing_module` is prepended to these modules (`railties/lib/rails/engine/lazy_route_set.rb:52-53`).

## Acceptance criteria

- The url / path helper modules are plain-object or class modules. A named route added after the include reaches includers without a carrier or an includer registry. The shape needs a repo-owner ruling, recorded in the PR.
- `git grep -n 'new Module' -- packages/actionpack/src/action-dispatch/routing packages/actionpack/src/abstract-controller/trailties` is empty.
- The routing, url-for and mounted-engine suites pass.
