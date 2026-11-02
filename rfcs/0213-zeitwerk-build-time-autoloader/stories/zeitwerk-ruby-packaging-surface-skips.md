---
title: "Receipt Zeitwerk's Ruby packaging surface as permanent skips"
status: ready
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["scripts", "zeitwerk"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0213 § "Non-goals" rules out Zeitwerk's Ruby packaging surface: trails packages are npm packages, and `Registry.loaderForPackage` reads a `package.json` (trails#9619). § "Verification" requires everything unported to be receipted, but `scripts/` on main has no entry for `lib/zeitwerk/gem_loader.rb`, `gem_inflector.rb`, `Loader.for_gem`, `for_gem_extension`, `Registry.loader_for_gem`, or `test_for_gem.rb` and `test_for_gem_extension.rb`.

## Acceptance criteria

- `SCOPED_SKIP_GROUPS` (or the source-unported list) covers those Ruby files and methods, citing the Non-goals ruling; each is a permanent skip, not a port.
- `loaderForPackage` carries its receipt against the same ruling.
- `parity:api` and `parity:test` for `zeitwerk` report nothing outstanding for this surface.
