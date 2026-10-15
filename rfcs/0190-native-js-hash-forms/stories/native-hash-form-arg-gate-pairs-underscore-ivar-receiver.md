---
title: "The call-argument gate pairs a keyed native form on this._x with its @x Ruby site"
status: in-progress
updated: 2026-10-15
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8929
claim: "2026-10-15T12:23:10Z"
assignee: "native-hash-each-pair-sites"
blocked-by: null
closed-reason: null
---

## Context

trails#8811 taught the call-SET gate that a Ruby ivar receiver may be spelled `this._x`: `hasNativeFormAnalogue` (`scripts/api-compare/compare.ts`) now credits `@env.merge!(…)` from `Object.assign(this._env, …)` (`actionpack/lib/action_controller/renderer.rb:118`, `packages/actionpack/src/action-controller/renderer.ts`), with a test beside "credits @options.key?(:x) from a membership test on this.options only" in `scripts/api-compare/extract-ts-api.test.ts`.

The call-ARGUMENT gate was not changed. `onSameHash` (`scripts/api-compare/call-args.ts:1012-1015`) pairs a keyed native form (`@in`, `@delete`) with its Ruby site only when the TS receiver is `id:<camel>`; `walkForCallArgs` (`scripts/api-compare/extract-ts-api.ts:6376-6387`) records `this._options` as `id:_options`. So `@options.key?(:only_path)` ported as `"onlyPath" in this._options` is credited by the call-set gate and its literal key is never compared: `"wrongKey" in this._options` passes both gates. Sites already in that state: `packages/actionpack/src/action-controller/renderer.ts:95` (`@env.key?("HTTP_HOST")`, `renderer.rb:154`), `packages/activesupport/src/cache/store.ts:76,83`, `packages/activerecord/src/type/adapter-specific-registry.ts:140`.

The same change also unblocks the four "underscore-prefixed field" sites listed in `native-hash-key-sites-uncredited-receiver-names`, which that story can now flip without further gate work.

## Acceptance criteria

- [ ] `onSameHash` pairs a Ruby ivar receiver (`id:@options`) with `id:_options` as well as `id:options`; a Ruby local `options` does not pair with `id:_options`.
- [ ] A test in `scripts/api-compare/call-args.test.ts` (beside the `on("key?", "id:@options", ["sym:only_path"])` cases at `:1564`) shows a wrong literal key on `this._options` is a `shape` row.
- [ ] `pnpm parity:api:calls:args` green; a real key mismatch this surfaces is fixed in the port, not baselined.
