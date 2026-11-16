---
title: "ViteRuby::Error#message applies :troubleshooting: lazily"
status: in-progress
updated: 2026-11-15
rfc: "0239-vite-assets-port"
cluster: null
packages: ["vite-assets"]
deps: []
deps-rfc: []
est-loc: 25
priority: 4
pr: trails#10158
claim: "2026-11-15T22:51:38Z"
assignee: "vite-assets-names-follow-vite-assets-convention"
blocked-by: null
closed-reason: null
---

## Problem

`vendor/.../vite_ruby/lib/vite_ruby/error.rb` overrides `message`, substituting `:troubleshooting:` lazily on every read. The TS `packages/vite-assets/lib/error.ts` does the substitution once, in the constructor, and declares no `message`, so `pnpm parity:api vite-assets` reports `ViteRuby::Error#message` as missing.

## Fix

Give `Error` a `message` getter that applies the substitution, matching Ruby, so subclasses that build their message after `super()` also get it. Keep the behaviour of the existing tests.

## Done when

`parity:api vite-assets` no longer lists error.rb `message`.
