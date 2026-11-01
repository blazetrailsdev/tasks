---
title: "Thor.map iterates keys through a ruby-compat each helper, dropping the invented Hash arm"
status: in-progress
updated: 2026-11-01
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9573
claim: "2026-11-01T15:19:18Z"
assignee: "call-set-credits-delete-expression"
blocked-by: null
closed-reason: null
---

## Context

`Thor.map` (`vendor/thor/v1.3.2/lib/thor.rb:101`) is `key.each { |subkey| @map[subkey] = value }` behind `key.respond_to?(:each)`. Ruby has one call, and Array, Set and Hash keys each answer their own `each`, with a Hash yielding `[k, v]` pairs.

trails#9335 converged the literal-name `rbFSend(key, "each", …)` in `packages/thor/src/thor.ts` `map` to direct iteration:
`for (const subkey of (isPlainHash(key) ? Object.entries(key) : key) as Iterable<string>)`.
A JS plain object has no `each` or iterator, so that ternary is an arm Ruby does not have. It carries `@inventedArm if — PERMANENT` on `map`.

ruby-compat's exported `each` (`packages/ruby-compat/src/array.ts:759`) takes an Array only. The full dispatch, over Array, Set, Map and plain Hash with pairs, exists only inside `sendInternal`'s `mid === "each"` arm (`packages/ruby-compat/src/object.ts:1268-1277`).

## Acceptance criteria

- [ ] A ruby-compat named `each` helper dispatches over Array, Set, Map and plain Hash, yielding `[k, v]` for a Hash as `rb_hash_each_pair` does (`vendor/ruby/v3.3.11/hash.c`). Either widen `array.ts`'s `each` or add one where `sendInternal`'s arm lives, and have that arm call it.
- [ ] `thor.ts` `map` is `each(key, (subkey) => (this._map![subkey] = value))`, with no ternary.
- [ ] The `@inventedArm if — PERMANENT` receipt on `map` is removed.
- [ ] The "yields each pair of a Hash key" test in `thor.trails.test.ts` still passes, and `parity:api:sends` stays green.
