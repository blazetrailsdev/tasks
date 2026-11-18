---
title: "Load libxml2-wasm by an awaited step, out of the boot graph's top-level await"
status: ready
updated: 2026-11-18
rfc: "0241-request-path-performance"
cluster: null
packages: ["actionview", "html-sanitizer", "nokogiri"]
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`libxml2-wasm` (reached through nokogiri → html-sanitizer → actionview `Base` / `SanitizeHelper`)
has a top-level await. Because actionview `Base` sits in a cycle with `log-subscriber.js`, an esbuild
bundle emits `await init_base()` inside a non-async `__esm` init, which is a SyntaxError, so
the serverless spike has to keep `libxml2-wasm` external and ship it beside the bundle. Every
app also pays the wasm instantiation at boot for a sanitizer it may never call.

## Acceptance criteria

- No top-level await is reachable from a trails app's boot graph through the sanitizer.
- `libxml2-wasm` is loaded and instantiated by an awaited step before first use, in the shape
  root CLAUDE.md already sanctions for `require`-as-awaited-step. Sanitizer behaviour is unchanged.
- An esbuild bundle of the spike app needs no `external` entry.
