---
title: "trailties: LazyRouteSet url helpers without a prototype splice"
status: draft
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["trailties", "actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
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
