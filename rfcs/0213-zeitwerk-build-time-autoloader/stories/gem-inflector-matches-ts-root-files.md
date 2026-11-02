---
title: "GemInflector matches .ts root files"
status: closed
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise gone: trails#9619 deleted the GemInflector port by owner decision (trails has no Ruby packaging concept). git grep 'GemInflector|gem-inflector|forGem' over origin/main packages/ and scripts/ returns nothing; packages/zeitwerk/src/gem-inflector.ts does not exist."
---

## Context

`packages/zeitwerk/src/gem-inflector.ts:9-11` computes the version file from a `.rb` root, as `vendor/zeitwerk/v2.7.2/lib/zeitwerk/gem_inflector.rb` does. trails loaders walk `.ts` / `.js` files (`loader.ts` strips `\.[jt]s$`), so `lib/my_gem/version.ts` is never inflected as `VERSION`. `Loader.for_gem` also reads `caller_locations` (`lib/zeitwerk/loader.rb:390`), which ruby-compat lacks. `packages/zeitwerk/src/gem-inflector.test.ts` parks 3 tests on this.

## Acceptance criteria

- `GemInflector` recognises `<root>/<namespace>/version.ts` for a `.ts` root file.
- `Loader.for_gem` has a way to learn its caller's file, so the parked tests in `gem-inflector.test.ts` can run under `zeitwerk-loader-inflector-tests`.
