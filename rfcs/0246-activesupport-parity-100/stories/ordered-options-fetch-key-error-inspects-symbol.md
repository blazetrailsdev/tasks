---
title: "OrderedOptions#fetch KeyError inspects the key as a Symbol"
status: in-progress
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10607
claim: "2026-11-22T22:24:08Z"
assignee: "activesupport-cache-format-version-accessor-property"
blocked-by: null
closed-reason: null
---

## Context

`OrderedOptions#fetch` (`packages/activesupport/lib/ordered-options.ts`, trails#10506) forwards to ruby-compat `fetch` over its `Map<string, unknown>` data. Its keys are the names of Ruby Symbols (`ordered_options.rb:32-43` stores `key.to_sym`). On a miss, `rb_hash_fetch_m` (`vendor/ruby/v3.3.11/hash.c:2176`) raises `KeyError` with `"key not found: #{key.inspect}"`, which reads `key not found: :nothing`. The Map arm inspects the JS string and reads `key not found: "nothing"`.

## Acceptance criteria

- [ ] `new OrderedOptions().fetch("nothing")` raises `KeyError` with the message `key not found: :nothing`, and its `key` is `"nothing"`. No new helper is added to OrderedOptions.
- [ ] A test in `test/ordered-options.trails.test.ts` pins the message.
