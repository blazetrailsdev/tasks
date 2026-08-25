---
title: "converge-shard-selector-symbol-to-string"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6498
claim: "2026-08-13T23:27:06Z"
assignee: "converge-shard-selector-symbol-to-string"
blocked-by: null
closed-reason: null
---

# ShardSelector's shard is a plain string, not a JS `Symbol`

## Context

Residual from `call-args-ar-kwarg-values`. One RFC 0095 `kind: "args"` row in
`scripts/api-compare/call-mismatches-exclude/activerecord/middleware/shard-selector.json`
(`set_shard` → `connected_to`) flags `kwargs{shard=ref:shardKey}` against Rails'
`kwargs{shard=ref:toSym}`.

Rails (`vendor/rails/activerecord/lib/active_record/middleware/shard_selector.rb:55-59`):

```ruby
def set_shard(shard, &block)
  ActiveRecord::Base.connected_to(shard: shard.to_sym) do
    ActiveRecord::Base.prohibit_shard_swapping(options.fetch(:lock, true), &block)
  end
end
```

trails (`packages/activerecord/src/middleware/shard-selector.ts:56-73`) types
`selectedShard` / `setShard` as `string | symbol` and converts a JS `Symbol`
back to a string via `Symbol.keyFor` / `.description`, raising `ArgumentError`
when neither yields a name. CLAUDE.md is explicit that a Ruby Symbol is a JS
string and that JS `Symbol` must not model one, so the conversion block is
itself the divergence — with `shard` a plain string, Rails' `to_sym` is a no-op
and the call site is `connectedTo({ shard })`.

## Acceptance criteria

1. `selectedShard` / `setShard` take and return a plain `string`; the
   `Symbol.keyFor` / `.description` block and its `ArgumentError` are deleted.
2. The `connectedTo` call passes `shard` straight through, matching
   shard_selector.rb:56.
3. The baseline row is deleted by hand (only-shrink; no `--write` reseed).
4. `pnpm vitest run packages/activerecord/src/middleware` green.
