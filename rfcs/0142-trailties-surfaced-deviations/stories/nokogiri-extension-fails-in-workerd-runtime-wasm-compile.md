---
title: "action_view.require_nokogiri fails in a Cloudflare Worker: libxml2-wasm compiles WebAssembly at run time"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "nokogiri"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/lib/trailties/action-view.ts:180-186` awaits `Nokogiri.loadPath["nokogiri/extension"]`
at every boot. `packages/nokogiri/lib/extension.ts` imports `libxml2-wasm`, whose `libxml2raw.mjs` compiles
an inline base64 binary when evaluated, and whose Emscripten `addFunction` compiles a wrapper module per JS
callback. workerd refuses both ("Wasm code generation disallowed by embedder"). Workers accept only
precompiled `.wasm` imports. `examples/cloudflare-worker/bundle.mjs` bundles `nokogiri/dist/extension.js`
empty, so `Nokogiri.LibXml2` is unset there and no HTML can be parsed or sanitized.

## Acceptance criteria

- [ ] Nokogiri's extension loads in workerd from a precompiled `.wasm` module with no run-time compile
      (an `addFunction`-free libxml2 build, or the signatures pre-seated in its function table).
- [ ] `examples/cloudflare-worker/bundle.mjs` drops its `without-libxml2` plugin and `sanitize` works there.
