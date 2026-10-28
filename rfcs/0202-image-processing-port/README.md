---
rfc: "0202-image-processing-port"
title: "image_processing over wasm-vips, on the mini_magick port"
status: active
created: 2026-10-21
updated: 2026-10-28
owner: "@deanmarano"
packages:
  - image-processing
clusters:
  - ip-vendor
  - ip-core
  - ip-backends
---

# RFC 0202 — image_processing over wasm-vips, on the mini_magick port

## Summary

Port the `image_processing` gem (1.14.0, `vendor/rails/v8.0.2/Gemfile.lock:289`),
the library ActiveStorage builds image variants with
(`activestorage/lib/active_storage/transformers/image_processing_transformer.rb:4`),
over the `mini_magick` gem (5.2.0, `Gemfile.lock:352`) its MiniMagick backend
drives. mini_magick itself is ported by RFC 0203
(`mini-magick-port-to-100`) and has landed as `packages/mini-magick`; this RFC
consumes it. The repo owner ruled the shape on 2026-10-21:

- `ImageProcessing::Vips` is backed by npm **`wasm-vips`**, libvips compiled
  to WebAssembly (first ruled `sharp`, switched the same day; see Alternatives).
- `mini_magick` is ported as the gem is: it builds ImageMagick command lines and
  **shells out**, through `child_process`, async. That port is RFC 0203's, and
  is on `main`.
- `ImageProcessing::Chainable` is a **Proxy that collects operations and is
  thenable**: `await` runs the pipeline, as `call` does.

## Motivation

trails has no image pipeline. The gem is small (lib 802 lines, 178 tests), its
core is pure Ruby, and both backends now have a Node footing: wasm-vips for
Vips, and the landed `@blazetrails/mini-magick` for MiniMagick. It is the
prerequisite for ActiveStorage variants, and a second gem for the
generate-then-polish process RFC 0201 used for marcel.

Shape of the source (tag `v1.14.0` of janko/image_processing; mini_magick
`v5.2.0` is vendored at `vendor/mini_magick/v5.2.0` already):

| Part                                                         | Lines  | Notes                                                 |
| ------------------------------------------------------------ | ------ | ----------------------------------------------------- |
| `image_processing/{chainable,builder,pipeline,processor}.rb` | ~310   | pure Ruby builder and pipeline                        |
| `image_processing/vips.rb`                                   | 228    | over ruby-vips: becomes `wasm-vips`                   |
| `image_processing/mini_magick.rb`                            | 260    | over `mini_magick`                                    |
| `mini_magick` lib                                            | ~1,280 | ported by RFC 0203 (`packages/mini-magick`), not here |

Tests: image_processing has 178 in Minitest::Spec style (`describe` / `it` /
`before`), comparing images by perceptual hash (`dhash-vips`,
`test/test_helper.rb:47-51`).

## Design

### Chainable is a thenable Proxy

`Chainable#method_missing` (`chainable.rb:86-91`) queues any unknown name as an
operation, runs a `!` name immediately (`send(name.chomp("!")).call`), and
leaves a `?` name to `super`. The port is a Proxy over the builder:

- An unknown property read answers a function that returns a new builder with
  the operation queued (`.invert()`, `.resizeToLimit(400, 400)`); the gem's own
  methods (`source`, `convert`, `loader`, `saver`, `instrumenter`, `apply`,
  `operation`, `call`, `branch`) are ordinary members.
- `then(resolve, reject)` runs the pipeline as `call()` with no arguments does,
  so `await ImageProcessing.Vips.source(file).resizeToLimit(400, 400)` is
  `….call(file)`. `call(file, { destination, … })` stays for the forms that
  take arguments.
- A `*Bang` name (`resizeToLimitBang`, the trails spelling of `resize_to_limit!`,
  docs/ruby-ts-conventions.md) queues and calls; an `is*` name reads as a Ruby
  predicate and is not queued.
- Names JS probes for itself are never operations: `then`, `catch`, `finally`,
  `constructor`, `toJSON`, `Symbol.toPrimitive` and the other well-known
  symbols.
- Builders are typed by the gem's methods plus each backend's known operations
  through an index signature, as CLAUDE.md records for `DynamicMatchers`.

The row "`image_processing/chainable.rb` | Proxy (thenable)" joins CLAUDE.md's
`method_missing` table. Precedent for an object that is both a value and
awaitable is `thenableHash` (CLAUDE.md "Serialization's dual sync/async hash").

**Hazard, documented on the Proxy:** JS awaits anything with a `then`, so
returning a builder from an `async` function or resolving a promise with it
runs the pipeline. With no source, `Pipeline#initialize` raises "source file is
not provided" (`pipeline.rb:11`), so the misuse fails loudly.

### Vips over wasm-vips

`wasm-vips` (0.0.19) is libvips built with Emscripten, and its API is the
libvips object model ruby-vips also binds: `vips.Image.newFromFile`, and every
libvips operation as a generated `Image` method under libvips' own name
(`ImageAutoGen` in its `vips.d.ts`). So `vips.rb` ports call for call:

| `vips.rb` / ruby-vips                                                 | wasm-vips                                                |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| `Image.new_from_file`, `Image.thumbnail`, `#thumbnail_image`          | `Image.newFromFile`, `Image.thumbnail`, `thumbnailImage` |
| `autorot`, `rot90/180/270`, `similarity(angle:)`                      | `autorot`, `rot90` …, `similarity`                       |
| `gravity(extend:, background:)`, `composite`, `conv` (`SHARPEN_MASK`) | `gravity`, `composite` / `composite2`, `conv`            |
| `write_to_file`, `write_to_buffer`, `has_alpha?`                      | `writeToFile`, `writeToBuffer`, `hasAlpha`               |
| `set` / `set_type` / `set_value` / `remove` (`vips.rb:149-152`)       | `setString` / `setInt` / … , `remove`, `getFields`       |
| `add_alpha` (ruby-vips Ruby, not a libvips operation)                 | ported as ruby-vips writes it, over `bandjoin`           |
| `Vips::MAX_COORD`                                                     | the same constant, ported                                |

A queued operation that is not one of `vips.rb`'s own methods
(`processor.rb:60`, `receiver.public_send`) is the `Image` method of that
libvips name, as in Ruby. Absent from wasm-vips, as from sharp: loader / saver
option introspection (`Vips::Introspect`, `vips_foreign_find_load`); see Open
questions.

`wasm-vips` is about 13 MB unpacked (with separate `heif` / `jxl` / `resvg`
modules), runs on Node ≥ 17, threads through worker threads, and is bounded by
WASM's 4 GB memory; it is slower than native libvips. It is declared an
optional peer, like `pg` / `mysql2` in activerecord.

### mini_magick is RFC 0203's

`MiniMagick::Shell#execute` (`shell.rb:29-40`) runs `Open3.capture3` under a
timeout; RFC 0203 ported it over ruby-compat's `Open3.capture3`, async from
`Shell` up (`mini-magick-shell-over-open3-capture3`, trails#9380), with
`Tool#method_missing` and `Image#method_missing` as Proxies
(`mini-magick-method-missing-proxies`, trails#9369) and zero `tsc` errors
(`mini-magick-typecheck-clean`, trails#9396). Its parity enrollment
(`mini-magick-parity-enrollment`) is open as trails#9398. The MiniMagick
backend here calls `@blazetrails/mini-magick`'s `Tool` as `mini_magick.rb`
calls `MiniMagick::Tool`, and every call it makes is async because
`Tool#call` is. ImageMagick on the CI runner is installed by RFC 0203.

### Process

image_processing goes marcel's way (RFC 0201): vendor, generate a starting point
with the Ruby-to-TS generator, polish on a branch, land. The generator gains
Minitest::Spec (`describe` / `it` / `before`) and RSpec support on its own
branch first; that is generator work, not stories here.

## Non-goals

- **ActiveStorage.** The consumer, its own RFC (`activestorage-port`), whose
  variant stories depend on this RFC's backends.
- **mini_magick.** RFC 0203's.
- **GraphicsMagick** (`MiniMagick.graphicsmagick`, `configuration.rb:12`): kept
  as configuration, not exercised in CI.

## Alternatives considered

- **sharp**, native libvips with prebuilt binaries: ruled first, then dropped
  by the owner on 2026-10-21. Its API is its own rather than libvips',
  so queued operations by name, the metadata setters and ruby-vips-built
  expected images in the tests would each need a hand mapping; wasm-vips keeps
  `vips.rb`'s by-name dispatch. sharp stays the option if variant throughput
  ever outweighs fidelity.
- **A non-thenable builder** with only `call`: rejected; `await` reads as the
  trigger Ruby's `call` is.

## Rollout

1. Vendor — `vendor-image-processing-and-mini-magick` (image_processing only;
   mini_magick is vendored)
2. Core — `image-processing-chainable-thenable-proxy`, `image-processing-pipeline-and-processor`
3. Backends — `image-processing-mini-magick-backend`, `image-processing-vips-backend-over-wasm-vips`
4. Tests — `image-processing-perceptual-hash-test-helper`

## Verification

- `image_processing`'s ported tests pass, each skip a
  `PERMANENT-SKIP` citing a ruling here.
- `parity:api` and `parity:test` report image-processing at 100%.
- CLAUDE.md's `method_missing` table has the Chainable row.

## Open questions

1. **Loader / saver option introspection** (`vips.rb:198-226`,
   `Vips::Introspect`): a static per-format option list (recommended), or pass
   every option to the loader / saver and let libvips reject an unknown one.
2. **The perceptual hash** `assert_similar` uses (`dhash-vips`'s IDHash): port
   IDHash over wasm-vips (recommended: it is libvips, as dhash-vips' is, so
   distances match the gem's threshold of 3).

Settled by the switch to wasm-vips: unmapped operations (a queued name is the
libvips operation, raising libvips' own error for an unknown one) and the
metadata setters (present).

## Changelog

- 2026-10-21: initial draft
- 2026-10-21: Vips backend switched from sharp to wasm-vips (owner ruling)
- 2026-10-28: aligned with RFC 0203 and the landed `packages/mini-magick`: the
  `mini-magick-port` story is removed (RFC 0203 replaces it), the vendor story
  covers image_processing only, the MiniMagick backend depends on
  `mini-magick-typecheck-clean`, and `mini-magick` leaves this RFC's packages
  and clusters
