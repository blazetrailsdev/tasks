---
title: "ViteRuby::Error#message applies :troubleshooting: lazily"
status: ready
updated: 2026-11-15
rfc: "0239-vite-assets-port"
cluster: null
packages: ["vite-assets"]
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Problem

`vendor/.../vite_ruby/lib/vite_ruby/error.rb` overrides `message`, substituting `:troubleshooting:` lazily on every read. The TS `packages/vite-assets/lib/error.ts` does the substitution once, in the constructor, and declares no `message`, so `pnpm parity:api vite-assets` reports `ViteRuby::Error#message` as missing.

## Fix

Give `Error` a `message` getter that applies the substitution, matching Ruby, so subclasses that build their message after `super()` also get it. Keep the behaviour of the existing tests.

## Done when

`parity:api vite-assets` no longer lists error.rb `message`.
