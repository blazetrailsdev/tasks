---
rfc: "0184-msgpack-gem-port"
title: "msgpack: a @blazetrails/msgpack gem port over @msgpack/msgpack, and ActiveSupport::MessagePack's ext registry on top of it"
status: active
created: 2026-10-06
updated: 2026-10-06
owner: "@deanmarano"
packages:
  - activesupport
  - msgpack
  - ruby-compat
  - activerecord
  - "scripts"
clusters:
  - fidelity
related-rfcs:
  - "0041-activesupport-messagepack-ext"
  - "0129-ruby-compat-moves"
priority: 5
---

# RFC 0184 — msgpack

## Summary

`msgpack` is a **gem dependency** of Rails, not Rails code:
`vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack.rb:3-10` is
`gem "msgpack", ">= 1.7.0"; require "msgpack"` inside `rescue LoadError`. trails
has no port of it. Instead `packages/activesupport/src/message-pack/factory.ts`
is 370 lines of hand-rolled codec — our own `Factory` / `Packer` / `Unpacker`,
every member `@internal`, with no Ruby counterpart anywhere.

This RFC ports the gem as its own package, `@blazetrails/msgpack`, wrapping the
`@msgpack/msgpack` npm library exactly as `packages/bcrypt` wraps `bcryptjs`, and
then lands `ActiveSupport::MessagePack::Extensions`' remaining ext types on top of
it. It supersedes RFC 0041, which scoped only the ext registry and so kept
absorbing gem-surface work (the `Factory#pool` story, the error-hierarchy story)
that has no home in activesupport.

## Motivation

Three problems share one root cause.

**1. The gem is unported, so gem surface is accruing inside activesupport.**
`extensions.rb` is written against the gem's API — `registry.register_type 0,
Symbol, packer: :to_msgpack_ext, unpacker: :from_msgpack_ext,
optimized_symbols_parsing: true` (`extensions.rb:20-24`). Every one of the ~18
registrations names the gem's `register_type` and the gem's per-type kwargs. With
no `MessagePack::Factory` to call, each ext story either reshapes those lines
(a missing call on `parity:api:calls`, a reshaped argument list on
`parity:api:calls:args`, across every registration) or grows `factory.ts` to meet
them. 0041 took the second route, which is why
`message-pack-serializer-pool-and-packer-block` and
`message-pack-unpacker-raises-one-invented-error-class` exist: they are the gem's
`Factory#pool` / `Pool#packer` and the gem's `UnpackError` /
`MalformedFormatError` / `UnknownExtTypeError` hierarchy, filed as activesupport
stories because there was nowhere else to put them.

**2. The hand-rolled codec has a silent data-corruption bug.** `register_type 1,
Integer, oversized_integer_extension: true` (`extensions.rb:26-29`) routes an
out-of-int64 Integer through `MessagePack::Bigint`. Probed on
`@msgpack/msgpack@3.1.3`, an oversized BigInt instead encodes as
`cf0000000000000000` and decodes as `0n` — truncation with no error. `msgpackr`
throws on the same input, so this is a property of the chosen library, not of
msgpack; either way the ext-1 path has to intercept before the native integer
path, and `MessagePack::Bigint` is gem code no JS library ships.

**3. The ext registry cannot be byte-interchangeable without the gem's
semantics.** `recursive: true`, `Pool`, `full_pack` / `full_unpack`,
`feed_reference`, and the signature `"\xCC\x80"` are all gem behaviour that
`extensions.rb` and `serializer.rb` depend on. Reimplementing them ad hoc is how
0041's scope grew; mirroring them once, in a package named after the gem, is how
it stops.

## Why a package, not ruby-compat and not direct calls

**Not ruby-compat.** That package is MRI core and stdlib — `rb_*` functions,
`Object`, `String`, `Hash`. No gem has ever lived there. Gems get a `vendor/`
source plus their own package: `bcrypt-ruby` → `packages/bcrypt`, `did_you_mean`
→ `packages/did-you-mean`, `globalid`, `i18n`, `nokogiri`, `rack`. ruby-compat is
also one of the pinned extra-surface packages under its "only what trails
actually calls" rule, so a `Factory` / `Packer` / `Unpacker` there means adding
non-MRI surface to the one package that forbids it, each member needing a
`@noRailsEquivalent PERMANENT` receipt for something that is not permanent.

**Not calling `@msgpack/msgpack` directly from `extensions.ts`.** That is
problem 1 above: every line this RFC exists to port would diverge from the Ruby
at that line, and the divergence would be paid for in baseline rows covering the
entire deliverable.

**Not a subdirectory of activesupport.** The `thor`-inside-`trailties` shape
(`PACKAGE_SRC_SUBDIR` in `scripts/api-compare/config.ts:104-112`) is **not
preferred and is being undone** (owner's call, 2026-10-06). A gem wrapper is its
own `@blazetrails/*` package.

## Shape

`packages/msgpack/`, mirroring msgpack-ruby's `lib/msgpack/` file-for-file as
`packages/bcrypt/src/` mirrors `lib/bcrypt/`:

| msgpack-ruby              | `packages/msgpack/src/`                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `factory.rb`              | `factory.ts` — `Factory`, `Factory::Pool`, `MemberPool`, `registerType`, `registeredTypes`, `isTypeRegistered`, `pool`, `dump`/`pack`, `load`/`unpack` |
| `packer.rb`               | `packer.ts`                                                                                                                                            |
| `unpacker.rb`             | `unpacker.ts`                                                                                                                                          |
| `buffer.rb`               | `buffer.ts`                                                                                                                                            |
| `bigint.rb`               | `bigint.ts` — `MessagePack::Bigint.to_msgpack_ext` / `from_msgpack_ext`, which ext type 1 names                                                        |
| `symbol.rb`               | `symbol.ts` — the `to_msgpack_ext` / `from_msgpack_ext` ext type 0 names                                                                               |
| `time.rb`, `timestamp.rb` | `time.ts`, `timestamp.ts`                                                                                                                              |
| `core_ext.rb`             | `core-ext.ts` — `to_msgpack`                                                                                                                           |
| `version.rb`              | `version.ts`                                                                                                                                           |

Tests split as bcrypt's do: `*.test.ts` for ports of the gem's own specs,
`*.trails.test.ts` for TS-only extras.

Three properties of the shape are decisions, not details:

- **The engine is `@msgpack/msgpack`** (3.1.3, ISC, zero runtime deps, ESM+CJS,
  own types), hidden behind the gem surface as `bcryptjs` is behind
  `packages/bcrypt`. Probed against what `extensions.rb` asks of the gem:
  `ExtensionCodec#register({type, encode, decode})` carries `register_type`'s
  free-function `match`; a nested `encode(v, {extensionCodec})` gives
  `recursive: true` byte-identical output (verified: `d503 9105` for an ext-3
  holding `[5]`); a catch-all registration gives
  `install_unregistered_type_error`; `Decoder#decodeMulti()` gives
  `unpacker.read` then `full_unpack`; and `encode(128)` is `cc80`, Rails'
  `SIGNATURE` exactly. `msgpackr` is faster and its `useBigIntExtension` is a
  real `oversized_integer_extension` analogue, but it writes a positive 2^62 as
  `d3` (int64) where Ruby and `@msgpack/msgpack` both write `cf` (uint64) — a
  cross-language byte divergence not worth taking on an interchange format.
- **The package is a leaf.** `factory.rb` and friends use only core Ruby, so
  `packages/msgpack` depends on `ruby-compat` and `@msgpack/msgpack` and nothing
  else; `activesupport` → `msgpack` takes no cycle. (Unlike `bcrypt`, which
  depends back on activesupport.)
- **It is an optional peer, and that is fidelity.** `message_pack.rb:3-10` warns
  and re-raises on `LoadError`. That is the shape `@blazetrails/nokogiri` already
  has in `packages/activesupport/package.json`'s `peerDependencies` +
  `peerDependenciesMeta.optional`, so the port of that `begin`/`rescue` has a
  real mechanism under it rather than an unconditional import.

## Vendoring

A `msgpack` source in `vendor/sources.ts` (`github.com/msgpack/msgpack-ruby`,
`libPath: "lib"`, `testPath: "spec"`). `lib/msgpack/` holds real Ruby with real
bodies — `factory.rb` defines `register_type`, `registered_types`,
`type_registered?`, `load`/`unpack`, `dump`/`pack`, `pool`, `Factory::Pool` and
`MemberPool`, with a `RUBY_ENGINE` split and `Mutex` pooling — so unlike `date`
this source can plausibly carry `compareApi: true`. `packer.rb` / `unpacker.rb` /
`buffer.rb` are thin over the C ext (`ext/msgpack/*.c`), so that flag is a
per-file call made in the vendoring story, with the C sources as read-anchors.

## Rollout

Ordered: the package first, then the ext types on top of it. Everything after
phase 1 is independently mergeable, and `parity:api` / `parity:test` deltas stay
non-negative throughout.

**Phase 1 — the package.**

- `msgpack-gem-package-and-vendor-source` — create `packages/msgpack`, vendor
  msgpack-ruby, move `factory.ts`'s behaviour onto the gem's file layout over
  `@msgpack/msgpack`, repoint `extensions.ts` / `serializer.ts`, delete the
  hand-rolled codec. Carries the registration checklist below.
- `message-pack-serializer-pool-and-packer-block` (rehomed, in flight on
  trails#8586) — `Factory#pool`, `Pool#packer`/`#unpacker`, `Factory#freeze`.
  Gem surface; rebases onto phase 1.
- `message-pack-unpacker-raises-one-invented-error-class` (rehomed) — the gem's
  `UnpackError` / `MalformedFormatError` / `UnknownExtTypeError` hierarchy in
  place of the single invented `MessagePackError`. Gem surface; largely dissolved
  by phase 1, which inherits `@msgpack/msgpack`'s own errors and maps them.
- `msgpack-bigint-ext-and-oversized-integer` — port `MessagePack::Bigint` and the
  `oversized_integer_extension` interception, with a regression test that fails on
  the `2n**70n` → `0n` truncation.

**Phase 2 — the ext registry** (`extensions.ts`, activesupport).

- `messagepack-ext-bigdecimal` (rehomed, in flight on trails#8586) — type 2.
- `big-decimal-max-prec-outside-literal-parse` (rehomed) — ruby-compat
  `BigDecimal` `MaxPrec` fidelity; the byte-exactness prerequisite for type 2.
- `messagepack-ext-temporal` (rehomed) — type 10 Duration remains; 5/6/7/8 landed.
- `messagepack-ext-value-classes` (rehomed) — types 11, 13-16.
- `message-pack-pool-size-reads-env-fetch` (rehomed) — `serializer.rb:54`'s
  `ENV.fetch("RAILS_MAX_THREADS", 5)` and the shared test that covers it.

## Registration checklist (phase 1)

A new workspace package has cost more than the usual four registrations before.
Beyond `pnpm-workspace.yaml`, root `tsconfig.json`, and both `vitest.config.ts`
aliases:

- `vendor/sources.ts` — the `msgpack` source (above).
- `scripts/api-compare/config.ts` — `PACKAGES` plus the package→source map. No
  `PACKAGE_SRC_SUBDIR` entry: that is the shape being undone.
- `.github/workflows/ci.yml` — the package-family regex (the gate half), the
  lane's `pnpm vitest run …` step, and the non-AR coverage package list.
  `scripts/ci-suite-coverage.test.ts` reds in Unit Tests for any `packages/*`
  holding a test that no lane runs.
- `scripts/ci-suite-coverage.test.ts`'s own synthetic fixtures, which `.replace()`
  the lane's `run:` line as a **verbatim literal**. Appending to that line
  silently no-ops the replace and fails `"reports a package a prefix-named
sibling's filter appears to cover"` — which reads like a broken guard rather
  than like this edit. Update the fixture literals in the same change.
- `eslint/rails-private-methods.json` coverage: if the vendored source lands with
  `compareApi: false`, add `msgpack` to the permanently-outside list in
  `scripts/api-compare/config.ts:205-215` beside `date`, with the reason.

## Non-goals

- Porting msgpack's C extension (`ext/msgpack/*.c`). The npm library is the
  engine, exactly as `bcryptjs` is for `packages/bcrypt`.
- `ActiveRecord::MessagePack` (`activerecord/lib/active_record/message_pack.rb`),
  which stays an `UNPORTED_FILES` row in
  `scripts/parity/unported-files/unscoped.ts:43-50` — it is the Marshal bridge,
  not part of the gem or of the activesupport registry.
