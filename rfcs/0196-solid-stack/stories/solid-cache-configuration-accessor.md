---
title: "SolidCache.configuration defaults to a ported Configuration"
status: done
updated: 2026-11-14
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10112
claim: "2026-11-14T22:31:29Z"
assignee: "port-solid-cache-record-configuration-and-entry"
blocked-by: null
closed-reason: null
---

# SolidCache.configuration defaults to a ported Configuration

## Context

`vendor/solid_cache/v1.0.7/lib/solid_cache.rb:13-14` declares
`mattr_accessor :executor` and `mattr_accessor :configuration, default: Configuration.new`.
trails#10030 ported the module as `packages/solid-cache/lib/solid-cache.ts` with
`executor` only, because `SolidCache::Configuration`
(`vendor/solid_cache/v1.0.7/lib/solid_cache/configuration.rb`) is not ported yet.

## Acceptance criteria

- `packages/solid-cache/lib/configuration.ts` ports `configuration.rb`, with its Rails names and defaults.
- `solid-cache.ts` adds `mattrAccessor.call(SolidCache, "configuration", { default: new Configuration() })`.
- The gem's tests that read `SolidCache.configuration` are ported under their Rails names.
