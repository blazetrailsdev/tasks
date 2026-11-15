---
title: "trailties: LazyRouteSet url helpers without a prototype splice"
status: ready
updated: 2026-11-15
rfc: "0142-trailties-surfaced-deviations"
cluster: conversion
packages: ["trailties", "actionpack"]
deps:
  - actionpack-route-set-helper-modules-without-live-include
deps-rfc: []
est-loc: 200
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
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
