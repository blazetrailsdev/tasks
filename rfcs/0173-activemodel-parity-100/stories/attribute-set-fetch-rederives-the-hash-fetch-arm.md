---
title: "activemodel: AttributeSet#fetch re-derives Hash#fetch's arm; an undefined default raises and a function default is called"
status: draft
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
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
closed-reason: null
---

## Context

Rails' `AttributeSet#fetch` has no body: `delegate :each_value, :fetch, :except, to: :attributes`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set.rb:10`), so the arguments and the
block reach `Hash#fetch` / `LazyAttributeHash#fetch` exactly as received. `LazyAttributeHash#fetch`
is itself delegated to `materialize` (`attribute_set/builder.rb:95`).

trails' `AttributeSet#fetch` (`packages/activemodel/src/attribute-set.ts:32-38`, seen while removing
its cast in trails PR 8459) takes one `defaultOrBlock?: T | ((name: string) => T)` parameter and
re-derives the arm itself, which diverges twice from `rb_hash_fetch_m`
(`vendor/ruby/v3.3.11/hash.c:2176`):

- `defaultOrBlock === undefined` selects the raising arm, so an explicitly passed `undefined`
  default raises `KeyError` where Ruby's `fetch(name, nil)` returns `nil`. ruby-compat's `fetch`
  already decides this on `rest.length`.
- `typeof defaultOrBlock === "function"` turns any function-valued default into a block and calls
  it, where Ruby returns a callable default as the value. ruby-compat marks a block with `block()`
  (`rbBlockGivenP`), and the one caller already has a block in hand
  (`packages/activerecord/src/attributes.ts:123` `this._defaultAttributes().fetch(name, () => null)`).

`LazyAttributeHash#fetch` (`packages/activemodel/src/attribute-set/builder.ts:173-178`) forwards
`rest[0] as Attribute` behind its own `rest.length === 0` test instead of forwarding `...rest`.

## Acceptance criteria

- [ ] `AttributeSet#fetch` forwards its arguments to `fetch(this.attributes(), name, ...rest)` with no arm selection of its own; a block is passed as a `block()`-branded `Block`, and callers (`attributes.ts:123`) are updated.
- [ ] `AttributeSet#fetch(name, undefined)` returns `undefined` for a missing key, and a function passed as a default is returned, not called. Each has a test in a `.trails.test.ts` twin that fails on the current body.
- [ ] `LazyAttributeHash#fetch` forwards `...rest` to `fetch(this.materialize(), name, ...rest)` with no cast.
- [ ] `pnpm typecheck`, `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:params` pass.
