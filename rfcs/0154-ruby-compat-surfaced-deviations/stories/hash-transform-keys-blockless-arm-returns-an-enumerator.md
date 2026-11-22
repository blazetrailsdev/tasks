---
title: "Hash#transformKeys and transformKeysBang answer a sized Enumerator when blockless"
status: draft
updated: 2026-11-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/lib/hash.ts` `Hash#transformKeys` / `transformKeysBang` (added in trails#10549) port the hash2 mapping arm and the block arm. They do not port the blockless arm: MRI `rb_hash_transform_keys` / `rb_hash_transform_keys_bang` (`vendor/ruby/v3.3.11/hash.c`, `transform_keys` family) start with `if (argc == 0) RETURN_SIZED_ENUMERATOR(hash, 0, 0, hash_enum_size);`, so `h.transform_keys` with neither a mapping nor a block returns an Enumerator.

## Acceptance criteria

- `transformKeys()` and `transformKeysBang()` called with no hash2 and no block return `toEnum(...)` sized by the hash's size, as `RETURN_SIZED_ENUMERATOR` does.
- A ruby-compat test covers both blockless arms.
