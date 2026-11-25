---
title: "Engine calledFrom is undefined where import.meta.dirname is (browser, bundles)"
status: draft
updated: 2026-11-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Engine.inherited` derives `called_from` itself, from `caller_locations` (`vendor/rails/v8.0.5.2/railties/lib/rails/engine.rb:360-371`), and `Engine#config` hands it to `find_root` (`engine.rb:553`). trails passes it at each registration site as `import.meta.dirname`: `packages/trailties/lib/trailties/action-view.ts:53` is `Engine.register(this, import.meta.dirname)`, and so are the engines in actioncable, activestorage, actionmailbox, actiontext, turbo, stimulus, solid-queue, solid-cache and solid-cable.

`import.meta.dirname` is Node-only. In a browser (and any bundle that does not define it) it is `undefined`, so `Engine.findRoot(undefined)` falls to `findRootWithFlag("lib", undefined)` and raises `Could not find root path for Trailtie` (`packages/trailties/lib/engine.ts:188`). That took blazetrails.dev/playground down for a day after trails#10715 made ActionView's railtie an Engine. trails#10753 worked around it inside the example: a Vite plugin (`examples/browser-sqlite/vite.config.ts`, `importMetaPaths`) rewrites `import.meta.dirname` / `filename` to a path under `/node_modules/@blazetrails`, and `src/runtime/main.ts` seats that directory in the virtual filesystem. The sibling story `worker-bundle-import-meta-url-undefined-in-workerd` did the same job for workerd.

## Acceptance criteria

- A framework engine's `calledFrom` is derived where Rails derives it, in the port of `Engine.inherited`'s registration (`engine.rb:360-371`), from a source that exists off Node (`import.meta.url` through the path adapter's `fileURLToPath`, or the caller location), not from `import.meta.dirname` at each call site.
- Booting `examples/browser-sqlite` passes `pnpm smoke` with the `importMetaPaths` plugin and the `SEAT_FRAMEWORK_DIR` global removed from the example.
- No `Engine.register(this, import.meta.dirname)` remains in a package's `lib/`.
