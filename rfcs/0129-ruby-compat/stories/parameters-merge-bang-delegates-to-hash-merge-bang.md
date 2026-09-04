---
title: "Parameters#merge! delegates to Hash#merge! instead of hand-rolling the conflict loop"
status: in-progress
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 14
pr: 7485
claim: "2026-09-04T15:50:46Z"
assignee: "route-remaining-default-env-call-sites"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::Parameters#merge!` delegates
(`vendor/rails/actionpack/lib/action_controller/metal/strong_parameters.rb:1022-1025`):

```ruby
def merge!(other_hash, &block)
  @parameters.merge!(other_hash.to_h, &block)
  self
end
```

trails' `Parameters#mergeBang`
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts`)
hand-rolls the loop instead — it iterates `Object.entries(otherData)` and
applies the conflict block itself, so the `merge!` call Rails makes is absent
and the block-vs-value dispatch is a second, unbranded copy of the one
`rb_hash_update` already implements (`vendor/ruby/hash.c:4028`, with
`rb_hash_update_block_i` at `:4012-4022`).

Since PR #7432, `mergeBang` in `@blazetrails/ruby-compat` detects its conflict
block by the `block()` mark rather than by `typeof === "function"`, which is
what made the delegation viable: the sibling `reverseMergeBang`
(`strong_parameters.rb:1042-1046`) already delegates and passes
`block((_key, left, _right) => left)`.

## Converged shape

```ts
mergeBang(otherHash: Parameters | Record<string, unknown>, block?: ConflictBlock<unknown>): this {
  mergeBang(this._data, toH(otherHash), block);
  return this;
}
```

— the ruby-compat `mergeBang` doing the merging, its `block?` parameter typed
as the marked `ConflictBlock` so there is one block idiom, and the local loop
deleted. Watch the name collision between the method and the imported function
(the import is already shadowed inside this method today).

## Acceptance criteria

- `Parameters#mergeBang` delegates to ruby-compat's `mergeBang` and makes no
  merge decisions of its own.
- Its conflict-block parameter is the marked `ConflictBlock`, not a bare
  function type.
- The `merge!` row stays absent from
  `scripts/api-compare/call-mismatches-exclude/actioncontroller/metal/strong-parameters.json`,
  and `parity:api:calls` / `:calls:args` stay green.
- The parameters and strong-parameters suites pass unchanged.
