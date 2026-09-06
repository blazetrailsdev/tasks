---
title: "register stores only the loader closure, so resolve recovers path_to_adapter by stringifying it"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails reads the registered path as **data**. `ConnectionAdapters.register`
stores `[class_name, path_to_adapter]`
(`vendor/rails/activerecord/lib/active_record/connection_adapters.rb:24-31`),
so `resolve` can compare `error.path == path_to_adapter` (`:47`) against a
value it was handed.

trails' `register(name, loader)`
(`packages/activerecord/src/connection-adapters.ts:31`) stores only the loader
closure — the registered path exists nowhere except inside that closure's
source. So PR #7530, implementing the two `LoadError` arms
(`connection_adapters.rb:44-51`), had to recover it by **stringifying the
closure**:

```ts
const pathToAdapter = /import[\w$]*\(\s*["']([^"']+)["']/.exec(loader.toString())?.[1] ?? null;
```

That works today and is verified against plain Node for all five failure
shapes, but it is a deviation with real edges:

- It reads source text, so it is sensitive to how a bundler rewrites the
  dynamic import. It already needs `import[\w$]*\(` rather than `import\(` to
  survive Vite's `__vite_ssr_dynamic_import__(`.
- A loader that computes its specifier, imports more than one module, or wraps
  the import in a helper has no single literal to find, and silently falls to
  the "Missing a package it depends on?" arm.
- The comparison is not Rails' `==`: Node reports a resolved absolute `file:`
  URL for a relative specifier and only the package name for a bare subpath, so
  `resolve` matches by `file:` pathname suffix / bare-prefix instead. That
  heuristic exists only because the two values live in different namespaces —
  which is exactly what having the registered path as data would remove.

## Converged shape

`register` carries the adapter's path the way Rails' `@adapters` hash does, so
`resolve` can compare the registered path directly instead of recovering it
from the closure. The Rails signature is
`register(name, class_name, path = name)` (`connection_adapters.rb:24`); the TS
analogue keeps the loader (ESM has no `require` by path) but takes the
specifier alongside it, e.g. `register(name, path, loader)`, and every
`register` call site in `connection-adapters.ts:100-116` passes the specifier it
already spells inside its loader.

With the registered path in hand, the `errorPath` side still has to be read
from the rejection — a JS module error genuinely carries no `LoadError#path`
twin — but the comparison stops being a source-text heuristic.

## Acceptance criteria

- [ ] `register` takes the adapter path as a value; `resolve` no longer calls
      `loader.toString()`.
- [ ] Both `LoadError` arms (`connection_adapters.rb:44-51`) keep their current
      behaviour for all five shapes #7530 verified against plain Node: relative
      specifier, nested relative specifier, bare package, bare subpath, and an
      adapter whose own dependency is missing.
- [ ] The arm tests in
      `packages/activerecord/src/database-configurations/hash-config.trails.test.ts`
      stay green without relying on Vitest-vs-Node error-reporting differences.
- [ ] Every built-in `register` call site passes its specifier.
- [ ] All three lanes green.
