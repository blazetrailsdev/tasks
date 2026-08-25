---
title: "Encryption cluster reads config/cipher/key_provider through free functions, not Configurable"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6138
claim: "2026-08-05T17:13:08Z"
assignee: "date-yday-drops-m-yday-fast-arms"
blocked-by: null
closed-reason: null
---

## Context

Rails' encryption cluster reads its configuration and context off the
`ActiveRecord::Encryption` module itself, resolved at call time:

- `ActiveRecord::Encryption.config.compressor` — `encryptor.rb:27`
- `ActiveRecord::Encryption.key_provider` — `encryptor.rb:98`, `scheme.rb`
- `ActiveRecord::Encryption.cipher` — `encryptor.rb:108`
- `ActiveRecord::Encryption.config.forced_encoding_for_deterministic_encryption` — `encryptor.rb:173`
- `ActiveRecord::Encryption.config.primary_key` — `context.rb:38`
- `ActiveRecord::Encryption.config.store_key_references` — `key_provider.rb:24`
- `ActiveRecord::Encryption.config.hash_digest_class` / `.key_derivation_salt` — `key_generator.rb`

PR #6127 (`configurable-reads-the-context-through-contexts`) made those five
files reach the same values through module-local free functions instead —
`getSharedConfig()` from `encryption/config.ts` and `getEncryptionContext()`
from `encryption/context.ts` — because importing `Configurable` from them is
what dragged `configurable.ts` into an ESM cycle. With `configurable.ts` now
importing `contexts.ts` (configurable.rb:17,33,36), that cycle reaches
`EncryptingOnlyEncryptor extends Encryptor`
(`encrypting_only_encryptor.rb:6`) and the subclass evaluates with `Encryptor`
in its TDZ — reproduced with a plain-node import of the built
`dist/encryption/encryptor.js`.

`getSharedConfig` carries a `@noRailsEquivalent` receipt at
`packages/activerecord/src/encryption/config.ts`. That receipt is debt, not
permission: Rails has exactly one spelling for this and trails now has two.

Sites, all in `packages/activerecord/src/encryption/`: `encryptor.ts`
(compressor, cipher, keyProvider, forcedEncodingForDeterministicEncryption),
`context.ts` (buildDefaultKeyProvider), `scheme.ts` (supportUnencryptedData,
keyProvider, deterministicKey), `key-provider.ts` (storeKeyReferences),
`key-generator.ts` (hashDigestClass, keyDerivationSalt).

Related latent cycle, surfaced while doing the above and left alone as
pre-existing: `config.ts:12` imports `DerivedSecretKeyProvider` for its own
SHA1 provider (`config.rb`), so `config.ts -> derived-secret-key-provider.ts
-> key-provider.ts` is a real cycle and a plain-node import of
`dist/encryption/key-provider.js` as an _entry module_ still throws on
`DerivedSecretKeyProvider extends KeyProvider`. That cycle predates #6127 (on
main it ran through `configurable.ts` instead) and no code path enters there,
but the same fix likely retires it.

## Converged shape

`Encryptor`, `Context`, `Scheme`, `KeyProvider` and `KeyGenerator` name
`Configurable.config`, `Configurable.cipher` and `Configurable.keyProvider` —
the trails spellings of `ActiveRecord::Encryption.config` / `.cipher` /
`.key_provider` — and `getSharedConfig` is deleted along with its
`@noRailsEquivalent` tag, with the singleton back on `Configurable` where
`mattr_reader :config, default: Config.new` (`configurable.rb:9`) declares it.

That needs the ESM cycle broken somewhere other than these five edges. The
untried lever is `contexts.ts`'s eager `import { EncryptingOnlyEncryptor }`:
Ruby resolves that constant at call time inside `protecting_encrypted_data`
(`contexts.rb:57`), so it carries no load-order weight there and it is the one
edge in the cycle that Ruby genuinely defers. Sibling story
`contexts-module-state-lives-in-context-ts` moves state in the same cluster and
may interact.

## Attempted and released (#6135, 2026-08-05)

The mechanical half was built and reverted. Pointing the five files at
`Configurable.config` / `.cipher` / `.keyProvider` and moving the singleton onto
`Configurable` (`let _config: Config | undefined` behind
`static get config()`, where `mattr_reader :config` declares it,
configurable.rb:9) typechecks and passes `pnpm tsc --build`. A plain-node import
of the BUILT dist as an ENTRY module then gives:

    encryptor:     FAIL Cannot access 'Encryptor' before initialization
    scheme:        FAIL Cannot access 'Encryptor' before initialization
    key-provider:  FAIL Cannot access 'KeyProvider' before initialization
    contexts / configurable / context / key-generator:  ok

exactly as this story predicts.

**The proposed lever does not open.** Deferring `contexts.ts`'s
`EncryptingOnlyEncryptor` import is not expressible: ESM hoists every `import`
and evaluates the whole dependency graph before any module body runs, so a
binding used only inside `protectingEncryptedData` still forces
`encrypting-only-encryptor.js` to evaluate — and with the entry at
`encryptor.js` its `class EncryptingOnlyEncryptor extends Encryptor`
(encrypting_only_encryptor.rb:6) evaluates with `Encryptor` still in TDZ. The
only synchronous deferral Ruby's autoload has and ESM lacks is a sync
`import()`; `import()` is async and `protectingEncryptedData` is sync
(contexts.rb:57 is called from a block form). Moving the class reference to a
namespace import, reordering the imports, or relocating
`protectingEncryptedData` into `context.ts` all leave the same
`... -> encrypting-only-encryptor -> encryptor` edge in the cycle.

Same shape for the second cycle: `config.ts:12` imports
`DerivedSecretKeyProvider` for its own SHA1 provider (config.rb), so
`config -> derived-secret-key-provider -> key-provider` breaks a
`key-provider.js` entry import on `DerivedSecretKeyProvider extends KeyProvider`.

So the next attempt should NOT start from the `contexts.ts` import. It needs a
different structural answer for "a module that references a subclass-defining
constant only inside a method body" — and whatever that answer is, it has to
serve both cycles. Worth checking whether any other trails package has already
settled an idiom for this before inventing one.

## Acceptance criteria

- [ ] The five files above read `Configurable.*`, not `getSharedConfig()` /
      `getEncryptionContext()`, at every site listed.
- [ ] `getSharedConfig` and its `@noRailsEquivalent` tag are deleted; the
      singleton lives behind `Configurable.config`.
- [ ] `configurable.ts` still reads `Contexts.context` /
      `Contexts.resetDefaultContext()` (configurable.rb:17,33,36) — do not
      converge this by reverting #6127.
- [ ] Verified with a plain-node import of the BUILT
      `dist/encryption/encryptor.js`, `contexts.js`, `configurable.js` and
      `key-provider.js` as entry modules, not just under vitest — vitest's
      setup files enter `configurable.js` first and mask the TDZ.
- [ ] Encryption suites green on all three lanes.
