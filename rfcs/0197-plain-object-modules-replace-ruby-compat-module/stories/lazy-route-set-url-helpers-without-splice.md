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
priority: null
pr: null
claim: "2026-10-21T14:24:34Z"
assignee: "activemodel-activesupport-module-super-inlined-into-includers"
blocked-by: "waits on actionpack NamedRouteCollection url_helpers_module/path_helpers_module leaving ruby-compat Module (route-set-generate-url-helpers-rails-module-shape): method_missing_module is prepended to those live-include modules (lazy_route_set.rb:52-53), so it cannot become a plain module first"
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
