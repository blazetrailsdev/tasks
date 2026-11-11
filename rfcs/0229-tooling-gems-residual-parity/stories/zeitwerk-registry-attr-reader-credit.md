---
title: "zeitwerk-registry-attr-reader-credit"
status: done
updated: 2026-11-11
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9983
claim: "2026-11-11T03:03:38Z"
assignee: "zeitwerk-registry-attr-reader-credit"
blocked-by: null
closed-reason: null
---

## Context

`Zeitwerk::Registry`'s `attr_reader :loaders` / `:autoloads`
(`vendor/zeitwerk/v2.7.2/lib/zeitwerk/registry.rb:12-27`) are still missing in
`pnpm parity:api` (registry.rb 6/8, 2026-11-10). `packages/zeitwerk/lib/registry.ts`
holds them as data properties of the `Registry` object literal, which the
object-literal credit (trails#9945) does not count as methods. `Loader#internal`
(`loader.rb:57`, `internal.rb`) is also unported.

## Acceptance criteria

- [ ] `Registry.loaders` / `.autoloads` are credited, as readers over the
      module's state or by extending the credit to data members.
- [ ] `pnpm parity:api` shows `registry.rb` 8/8.
