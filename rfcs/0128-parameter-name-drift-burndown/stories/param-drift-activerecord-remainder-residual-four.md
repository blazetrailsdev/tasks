---
title: "param-drift-activerecord-remainder-residual-four"
status: done
updated: 2026-08-30
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: 7221
claim: "2026-08-29T23:24:10Z"
assignee: "param-drift-activerecord-remainder-residual-four"
blocked-by: null
closed-reason: null
---

## Context

`param-drift-activerecord-remainder` (PR pending) cleared every remainder-scope
parameter-name row that is a rename. Four rows survive because the TS parameter
holds something _different_ from the Rails one — a rename would spell a lie —
and each needs its own convergence, not a spelling change.

```text
  encryption/auto_filtered_parameters.rb#initialize @0  `app` → `filterParameters`
  encryption/cipher/aes256_gcm.rb#generate_iv       @0  `cipher` → `deterministic`
  middleware/database_selector.rb#call              @0  `env` → `request`
  middleware/shard_selector.rb#call                 @0  `env` → `request`
```

- `AutoFilteredParameters#initialize`
  (`vendor/rails/activerecord/lib/active_record/encryption/auto_filtered_parameters.rb:6`)
  stores `@app` — the Rails application — and reads
  `app.config.filter_parameters`. The port
  (`packages/activerecord/src/encryption/auto-filtered-parameters.ts:10`) takes the
  `string[]` of filter parameters and synthesises an `app` getter around it
  (`auto-filtered-parameters.ts:36-38`). Converging means taking the application
  object, which needs whatever trails' application analogue is at that point.

- `Aes256Gcm#generate_iv(cipher, clear_text)`
  (`.../encryption/cipher/aes256_gcm.rb:87`) reaches `cipher.random_iv` for the
  non-deterministic arm. Node's `createCipheriv` needs the IV to _construct_ the
  cipher, so `packages/activerecord/src/encryption/cipher/aes256-gcm.ts:52` computes
  the IV first and `generateIv` is handed `this.deterministic` instead
  (`aes256-gcm.ts:109`). Converging needs the deterministic branch decided
  without a cipher object, or a cipher stand-in that can mint a random IV.

- Both middlewares' `call(env)`
  (`.../middleware/database_selector.rb:60`, `.../middleware/shard_selector.rb:62`)
  build `ActionDispatch::Request.new(env)`. The port is handed the request
  directly — `shard-selector.ts:38` already carries the JSDoc for it: naming
  `ActionDispatch::Request` in activerecord would make actionpack a hard ESM
  dependency that `activerecord.gemspec` does not declare. Convergeable with
  RFC 0106 (call-time constant resolution), not before.

A fifth row, `type.rb#lookup @0 args → lookupKey`, is a MEASUREMENT artifact and
needs no source change: `type.ts` re-exports `TypeMap`, so the extractor files
`TypeMap#lookup` under `type.ts` and pairs it with `type.rb#lookup`. `lookupKey`
IS the Rails identifier — from `type/type_map.rb:14`, which scores 100% in its
own file. The fix, if any, belongs to the comparer's file attribution.

## Acceptance criteria

- The four rows above are gone from `output/param-name-mismatches.json` for
  `--package activerecord`, each by converging the parameter to what Rails holds
  — not by renaming a differently-typed value.
- Where a row cannot converge until another RFC lands (the two middleware rows,
  RFC 0106), the story is `pnpm tasks block`ed naming that dependency rather than
  closed with a justification.
- No behaviour change; `pnpm parity:api` methods and arity figures unmoved.
