---
title: "Create @blazetrails/msgpack over @msgpack/msgpack, and vendor msgpack-ruby"
status: in-progress
updated: 2026-10-06
rfc: "0184-msgpack-gem-port"
cluster: null
packages: ["msgpack", "scripts"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: trails#8591
claim: "2026-10-06T18:09:31Z"
assignee: "msgpack-package-and-vendor-source"
blocked-by: null
closed-reason: null
---

## Context

`msgpack` is a gem dependency of Rails, not Rails code:
`vendor/rails/v8.0.2/activesupport/lib/active_support/message_pack.rb:3-10` is
`gem "msgpack", ">= 1.7.0"; require "msgpack"` inside `rescue LoadError => error`.

trails has no port of it. `packages/activesupport/src/message-pack/factory.ts`
(370 lines) is a hand-rolled stand-in for `MessagePack::Factory` / `Packer` /
`Unpacker`, every member `@internal`, with no Ruby counterpart. Per RFC 0184 a gem
wrapper is its own `@blazetrails/*` package, mirroring the gem's file layout, with
an npm library as the engine — the `packages/bcrypt` / `bcryptjs` shape. This story
creates the package and leaves activesupport untouched; the repoint is
`msgpack-repoint-activesupport-onto-the-package`.

Vendor source: `github.com/msgpack/msgpack-ruby`, `libPath: "lib"`,
`testPath: "spec"`. `lib/msgpack/` is real Ruby with real bodies — `factory.rb`
defines `register_type`, `registered_types`, `type_registered?`, `load`/`unpack`,
`dump`/`pack`, `pool`, `Factory::Pool` and `MemberPool`, with a `RUBY_ENGINE`
split and `Mutex` pooling — so `compareApi` can plausibly be `true` here, unlike
`date`. `packer.rb` / `unpacker.rb` / `buffer.rb` are thin over `ext/msgpack/*.c`,
so make that call per file and keep the C sources as read-anchors.

Engine: `@msgpack/msgpack` 3.1.3 (ISC, zero runtime deps, ESM+CJS, own types).
Probed against what `extensions.rb` asks of the gem:

- `ExtensionCodec#register({type, encode, decode})` carries `register_type`'s
  free-function match, including a catch-all for
  `install_unregistered_type_error` (`extensions.rb:99-110`).
- a nested `encode(v, {extensionCodec})` is `recursive: true`, byte-identical:
  an ext-3 holding `[5]` encodes `d503 9105`.
- `Decoder#decodeMulti()` is `unpacker.read` then `full_unpack`
  (`serializer.rb:19-24`).
- `encode(128)` is `cc80`, Rails' `SIGNATURE` (`serializer.rb:8`) exactly.

`msgpackr` was the alternative and is faster, but it writes a positive 2^62 as
`d3` (int64) where Ruby and `@msgpack/msgpack` both write `cf` (uint64) — a
cross-language byte divergence not worth taking on an interchange format.

The package is a leaf: `factory.rb` and friends use only core Ruby, so it depends
on `@blazetrails/ruby-compat` and `@msgpack/msgpack` and nothing else. Do not add
an activesupport dependency — `activesupport` depends on this package, and the
cycle is what keeps `bcrypt` from being a leaf.

## Acceptance criteria

- `vendor/sources.ts` gains the `msgpack` source; `pnpm vendor:fetch` populates
  `vendor/msgpack/v<ref>/`, and every citation in this package names that version.
- `packages/msgpack/` exists as `@blazetrails/msgpack`, shaped like
  `packages/bcrypt`: `package.json` (`type: module`, `exports`, `files: [dist]`,
  `build: tsc`), `tsconfig.json`, `src/`.
- `src/` mirrors `lib/msgpack/` file-for-file for this story: `factory.ts`
  (`Factory`, `Factory::Pool`, `MemberPool`, `registerType`, `registeredTypes`,
  `isTypeRegistered`, `pool`, `dump`/`pack`, `load`/`unpack`), `packer.ts`,
  `unpacker.ts`, `buffer.ts`, `version.ts`, `index.ts`. `bigint.ts` / `symbol.ts`
  / `time.ts` / `timestamp.ts` / `core-ext.ts` are later stories.
- Errors are the gem's: `MessagePack::UnpackError`, `MalformedFormatError`,
  `UnknownExtTypeError`, `StackError`, mapped from `@msgpack/msgpack`'s own.
  No invented `MessagePackError`.
- Tests split as bcrypt's do: `*.test.ts` ports of the gem's `spec/`,
  `*.trails.test.ts` for TS-only extras.
- Registrations: `pnpm-workspace.yaml`, root `tsconfig.json`, both
  `vitest.config.ts` aliases, `scripts/api-compare/config.ts` (`PACKAGES` and the
  package to source map, with NO `PACKAGE_SRC_SUBDIR` entry), and in
  `.github/workflows/ci.yml` the package-family regex, the lane's
  `pnpm vitest run ...` step and the non-AR coverage list.
- `scripts/ci-suite-coverage.test.ts`'s synthetic fixtures `.replace()` the
  lane's `run:` line as a verbatim literal, so appending to that line silently
  no-ops and fails `reports a package a prefix-named sibling's filter appears to
cover`. Update those fixture literals in this PR.
- If the source lands `compareApi: false`, add `msgpack` to the
  permanently-outside list in `scripts/api-compare/config.ts` beside `date`, with
  the reason.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
