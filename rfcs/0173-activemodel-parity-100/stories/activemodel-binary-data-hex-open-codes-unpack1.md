---
title: 'activemodel: Binary::Data#hex open-codes unpack1("H*") over the Uint8Array seat'
status: done
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8439
claim: "2026-10-03T09:25:23Z"
assignee: "activemodel-binary-data-hex-open-codes-unpack1"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8413. Rails (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/binary.rb:53-55`):

    def hex
      @value.unpack1("H*")
    end

`packages/activemodel/src/type/binary.ts#hex` open-codes it: `Array.from(this.value).map((b) => b.toString(16).padStart(2, "0")).join("")`. `@value` is a `Uint8Array`, the binary String seat, and ruby-compat's `unpack1` (`packages/ruby-compat/src/array.ts`) takes a JS string, so the call cannot be made as it stands. `attr-names-and-build-mangled-name-open-code-unpack1-h` is the same shape over a JS string.

## Acceptance criteria

- [ ] `unpack1` accepts the `Uint8Array` seat for `"H*"` (`pack_unpack_internal`, `vendor/ruby/v3.3.11/pack.c`).
- [ ] `Data#hex` is `unpack1(this.value, "H*")`.
- [ ] `pnpm parity:api:calls` shows no `unpack1` row for `type/binary.ts#hex`.
