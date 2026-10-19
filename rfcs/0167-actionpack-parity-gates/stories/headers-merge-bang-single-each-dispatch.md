---
title: "headers-merge-bang-single-each-dispatch"
status: done
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9053
claim: "2026-10-19T01:10:20Z"
assignee: "block-param-burndown-actiondispatch"
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::Headers#merge!` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/headers.rb:112-116`) is `headers_or_env.each do |key, value|`, one call that Ruby dispatches to `Hash#each` or `Headers#each` (`headers.rb:96`), auto-splatting the yielded pair. The port (`packages/actionpack/src/action-dispatch/http/headers.ts`, `mergeBang`) branches on `instanceof Headers` because `Headers#each` yields one `[key, value]` pair, while ruby-compat's `eachPair` (`packages/ruby-compat/src/hash.ts`) sends a receiver's own `each` a two-parameter block.

## Acceptance criteria

- `mergeBang` makes one `each` call over either receiver. For example, `eachPair` could splat a single array yielded by a receiver's own `each`, the way MRI's `rb_block_pair_yield_optimizable` does.
- The `@inventedArm if` receipt on `mergeBang` is removed.
