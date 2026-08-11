---
title: "Cipher#decrypt has no Kernel#Array to build its keys: kwarg"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6368
claim: "2026-08-11T16:13:43Z"
assignee: "naming-burndown-ar-field-and-body-restructures"
blocked-by: null
closed-reason: null
---

# `Cipher#decrypt` has no `Kernel#Array` to build its `keys:` kwarg

## Context

Surfaced by the RFC 0099 classification pass and left unconverged by PR #6361;
the row is in
`scripts/api-compare/call-mismatches-exclude/activerecord/encryption/cipher.json`
(`decrypt` → `try_to_decrypt_with_each`, `kind: "args"`), carrying this blocker
as its reviewed reason.

**Rails** (`vendor/rails/activerecord/lib/active_record/encryption/cipher.rb:25-29`):

```ruby
def decrypt(encrypted_message, key:)
  try_to_decrypt_with_each(encrypted_message, keys: Array(key)).tap do |decrypted_text|
    decrypted_text.force_encoding(encrypted_message.headers.encoding || DEFAULT_ENCODING)
  end
end
```

`Array(key)` is `Kernel#Array` — the one-or-many normalization Rails leans on
all over. trails (`packages/activerecord/src/encryption/cipher.ts:17-23`) has no
port of it, so the call site hoists a local and spells the normalization inline
as `Array.isArray(options.key) ? options.key : [options.key]`, which extracts as
a different argument ref and cannot match `ref:Array`.

## Converged shape

Either port `Kernel#Array` (ActiveSupport is its natural home; note it is NOT
`Array.wrap` — `Kernel#Array` calls `to_ary` then `to_a`, and `Array(nil)` is
`[]`) and call it inline at cipher.rb:26, or establish the settled trails idiom
for `Kernel#Array` and apply it here. Check for sibling call sites that spell
the same normalization by hand before picking.

## Acceptance criteria

1. `decrypt` passes its `keys:` kwarg the way cipher.rb:26 does, with no hoisted
   local.
2. The baseline row is deleted by hand (only-shrink; no `--write` reseed).
3. `pnpm parity:api:calls:args` green; encryption suites green.
