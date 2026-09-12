---
title: "encryption/: receipt or relocate the 32 moved extras across configurable, cipher, properties and the attribute type"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 220
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` measures `novel: 0` but **396 unreceipted
moved extras** (measured 2026-09-12 off a full `pnpm build` + `pnpm parity:api`). A moved extra
is a public TS name Rails DOES define — just in a different `.rb` — and it counts against
the `total` dimension of `scripts/api-compare/extra-surface-mark.json`, which
`activerecord`'s row currently pins at 396.

`enrol-activerecord-in-tagged-only-mode` cannot land until `total` reaches 0, because its
acceptance criterion is that activerecord needs **no row** in the mark file, and the mark's
module comment is explicit that tagged-only mode does NOT drop the `total` dimension:
`parity:api:moves` only reports, and `blazetrails/rails-file-structure-method-order`
orders members within one file's container and so cannot see a cross-file relocation at all
(RFC 0127's `gate-the-wrong-file-moves-population` records the same finding against
PR #7283). RFC 0130's Non-goals entry claiming tagged-only mode drops `total` predates that
and is stale.

396 receipts across 125 files is far past one PR's LOC ceiling, so the burndown is cut by area
exactly as the `receipt-*` novel-burndown stories were. **This story is the encryption area:
32 names across 12 files.**

`encryption/configurable.ts`'s 6 (`cipher`, `encryptor`, `keyGenerator`,
`keyProvider`, `messageSerializer`, `frozenEncryption`) are the config readers Rails reaches
through `ActiveRecord::Encryption.config`
(`activerecord/lib/active_record/encryption/configurable.rb:10-18` plus
`encryption/config.rb`'s `attr_accessor` block), so they land on a different `.rb`
than the one they are declared in here. `encryption/properties.ts`'s `entries`/`size`/
`toJSON` are the JS spelling of Ruby's `Properties < Hash` delegation
(`encryption/properties.rb:19-20`). `encryption-hooks.ts` and `encryption/index.ts` have no
Rails counterpart file.

### The population

- `encryption/configurable.ts` (`encryption/configurable.rb`) — 6: cipher, encryptor, frozenEncryption, keyGenerator, keyProvider, messageSerializer
- `encryption-hooks.ts` _(no Rails counterpart)_ — 5: ciphertextFor, decrypt, encrypt, encryptedAttribute, encrypts
- `encryption/cipher.ts` (`encryption/cipher.rb`) — 5: Cipher, decrypt, encrypt, ivLength, keyLength
- `encryption/cipher/aes256-gcm.ts` (`encryption/cipher/aes256_gcm.rb`) — 3: deterministic, secret, toJSON
- `encryption/encrypted-attribute-type.ts` (`encryption/encrypted_attribute_type.rb`) — 3: ignoreCase, name, serializeCastValue
- `encryption/properties.ts` (`encryption/properties.rb`) — 3: entries, size, toJSON
- `encryption/extended-deterministic-queries.ts` (`encryption/extended_deterministic_queries.rb`) — 2: toString, valueForDatabase
- `encryption.ts` (`encryption.rb`) — 1: isEncryptedAttribute
- `encryption/envelope-encryption-key-provider.ts` (`encryption/envelope_encryption_key_provider.rb`) — 1: constructor
- `encryption/errors.ts` (`encryption/errors.rb`) — 1: constructor
- `encryption/index.ts` _(no Rails counterpart)_ — 1: isEncryptedAttribute
- `encryption/scheme.ts` (`encryption/scheme.rb`) — 1: key

### How a name resolves

Each name resolves one of four ways — the story must say which way each went, and
"add a tag" is not a plan (RFC 0130, "The 342 are not one population"):

1. **Delete it.** Extra surface whose call site can move to the ported method, or which
   has no call site at all. Preferred: it lowers `total` without a receipt.
2. **Relocate it** to the TS file mirroring the `.rb` that defines it. This is the
   convergence `moved` is actually asking for, and it lowers `total` too.
3. **Credit it in the extractor**, where the name is Rails surface the Ruby extractor
   cannot see (a `define_model_callbacks` product, a `delegate`, a generated reader).
   A receipt on a faithful port is a lie about it; the fix lands once for the group.
4. **`@noRailsEquivalent PERMANENT`** for a genuine, already-ratified TypeScript language
   shortcoming, or **`@noRailsEquivalent CONVERGEABLE <story-id>`** with a filed story.
   A bare `CONVERGEABLE` with no id is half a receipt and the run says so.

Write the receipt as a MULTI-LINE JSDoc block: a one-line `/** @noRailsEquivalent … */`
does not register, and `no-freeform-comments` autofixes prose out of the block, so the
tag must stand alone and the reasoning belongs in the story it cites.

The census above is a snapshot, not a target — sibling PRs move it. Re-measure at claim
time with `pnpm build && pnpm parity:api && pnpm parity:api:extra --package activerecord`
and gate on this area reaching 0, not on the absolute number in this body (a stale census
already cost a blocking review on #7516).

## Acceptance criteria

- Every moved extra in this area is deleted, relocated, credited in the extractor, or
  carries a `@noRailsEquivalent PERMANENT` / `CONVERGEABLE <story-id>` receipt at its
  declaration; `pnpm parity:api:extra --package activerecord` reports 0 extras for each
  file listed above.
- activerecord's `total` in `scripts/api-compare/extra-surface-mark.json` is tightened in
  the same PR with `pnpm parity:api:extra:tighten`. The mark is only-shrink and there is
  no reseed — a name that cannot be resolved gets a `CONVERGEABLE` receipt, not room.
- `pnpm parity:api:extra:gate` is green, and the unstated-permanence count in the
  extra-surface run does not rise.
- Every receipt cites a `vendor/rails/` `file:line` for the Rails name it stands against,
  in the story it points at where the tag itself cannot carry prose.

## Definition of done

A `@noRailsEquivalent` whose reason was generated rather than reasoned does NOT close this
story — that is the "tag all of them mechanically" alternative RFC 0130 rejected as "fast and
worthless". Route 1 (delete) and route 2 (relocate) have to be tried per name before a
receipt is written, which is what makes this a burndown rather than a `sed` script. Raising
activerecord's `total` mark does not close it either; the mark is only-shrink and there is no
reseed.

## Verification

```sh
pnpm build && pnpm parity:api                      # the manifests the measurement reads
pnpm parity:api:extra --package activerecord        # this area's files report 0 extras
pnpm parity:api:extra:tighten                       # writes `total` DOWN, never up
pnpm parity:api:extra:gate                          # green
```

`pnpm parity:api:extra --package activerecord` must show no row for any of the 32 names
listed above, and activerecord's `total` in `scripts/api-compare/extra-surface-mark.json`
must fall by the number this story resolved.

## Notes

Two checks are easy to miss and both are green locally / red in CI: `pnpm parity:api --extra`
does **not** run the STALE-tag gate, and `parity:api:extra:gate` does **not** run the
REDUNDANT-tag check — only `pnpm parity:api:extra --package <pkg>` prints the latter. So run
the `--package` form, not just the gate.

A receipt placed in a file outside the measured population — `src/test-helpers/**`,
`src/support/**` — is always a STALE tag: there is nothing there for it to suppress, and only
the CI compare job catches it.

Extra-surface totals move with **build state**, not with the commit: an unbuilt package's
types go unresolved and the methods carrying them drop out of the population. Always
`pnpm build` before measuring, and use `API_COMPARE_FORCE=1` if a warm cache is
under-reporting.
