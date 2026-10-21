---
title: "trailties: LazyRouteSet url helpers without a prototype splice"
status: blocked
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["trailties", "actionpack"]
deps:
  - actionpack-route-set-helper-modules-without-live-include
deps-rfc: []
est-loc: 200
priority: 14
pr: null
claim: "2026-10-21T14:24:34Z"
assignee: "activemodel-activesupport-module-super-inlined-into-includers"
blocked-by: "route-set-generate-url-helpers-rails-module-shape is done, but the url/path helper modules it prepends method_missing_module to (route-set.ts:543-544,810) are still ruby-compat Module on a live include; waits on actionpack-route-set-helper-modules-without-live-include"
closed-reason: null
---

## Context

`LazyRouteSet#generateUrlHelpers` splices a Proxy beneath the generated
url-helpers `Module`, because a trails `Module` copies its carrier into each
includer (CLAUDE.md § "Ruby protocol methods…", the
`rails/engine/lazy_route_set.rb` row). Rails:
`railties/lib/rails/engine/lazy_route_set.rb` `method_missing_module`.

## Acceptance criteria

- The url-helpers module is a plain-object or class module, and the
  `method_missing_module` trap reaches includers without a carrier.
- The CLAUDE.md bullet is updated.
