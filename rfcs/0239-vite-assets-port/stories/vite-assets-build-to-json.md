---
title: "ViteRuby::Build#to_json is ported"
status: in-progress
updated: 2026-11-15
rfc: "0239-vite-assets-port"
cluster: null
packages: ["vite-assets"]
deps: []
deps-rfc: []
est-loc: 30
priority: 3
pr: trails#10158
claim: "2026-11-15T22:51:38Z"
assignee: "vite-assets-names-follow-vite-assets-convention"
blocked-by: null
closed-reason: null
---

## Problem

`ViteRuby::Build` is a `Struct`, and `build.rb` calls `to_json` on it when writing the last-build metadata. `pnpm parity:api vite-assets` on origin/main reports `ViteRuby::Build#to_json` (TS `toJSON`) as missing in `packages/vite-assets/lib/build.ts`.

## Fix

Add `toJSON()` to `Build`. It returns the struct members under their Ruby (snake_case) keys, the same shape `parseMetadata` reads back. Route the existing metadata write through it, and add a round-trip assertion to the build test.

## Done when

`parity:api vite-assets` no longer lists build.rb `to_json`.
