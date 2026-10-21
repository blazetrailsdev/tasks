---
rfc: "0000-image-processing-port"
title: "image_processing over sharp, and mini_magick shelling out"
status: draft
created: 2026-10-21
updated: 2026-10-21
owner: "@deanmarano"
packages:
  - image-processing
  - mini-magick
clusters:
  - ip-vendor
  - mini-magick
  - ip-core
  - ip-backends
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — image_processing over sharp, and mini_magick shelling out

## Summary

Port the `image_processing` gem (1.14.0, `vendor/rails/v8.0.2/Gemfile.lock:289`),
the library ActiveStorage builds image variants with
(`activestorage/lib/active_storage/transformers/image_processing_transformer.rb:4`),
and the `mini_magick` gem (5.2.0, `Gemfile.lock:352`) its MiniMagick backend
drives. The repo owner ruled the shape on 2026-10-21:

- `ImageProcessing::Vips` is backed by npm **`sharp`**, which wraps libvips.
- `mini_magick` is ported as the gem is: it builds ImageMagick command lines and
  **shells out**, through `child_process`, async.
- `ImageProcessing::Chainable` is a **Proxy that collects operations and is
  thenable**: `await` runs the pipeline, as `call` does.

## Motivation

trails has no image pipeline. The gem is small (lib 802 lines, 178 tests), its
core is pure Ruby, and both backends now have a decided Node footing. It is the
prerequisite for ActiveStorage variants, and a second gem for the
generate-then-polish process RFC 0201 used for marcel.

Shape of the source (tag `v1.14.0` of janko/image_processing, and `v5.2.0` of
minimagick/minimagick):

| Part                                                         | Lines  | Notes                                                             |
| ------------------------------------------------------------ | ------ | ----------------------------------------------------------------- |
| `image_processing/{chainable,builder,pipeline,processor}.rb` | ~310   | pure Ruby builder and pipeline                                    |
| `image_processing/vips.rb`                                   | 228    | over ruby-vips: becomes `sharp`                                   |
| `image_processing/mini_magick.rb`                            | 260    | over `mini_magick`                                                |
| `mini_magick` lib                                            | ~1,280 | builds argv, runs `Open3.capture3` with a timeout (`shell.rb:35`) |

Tests: image_processing has 178 in Minitest::Spec style (`describe` / `it` /
`before`), comparing images by perceptual hash (`dhash-vips`,
`test/test_helper.rb:47-51`). mini_magick has ~137 RSpec examples.

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

### Vips over sharp

Every Vips processor method maps onto sharp:

| `vips.rb`                                                                                   | sharp                                                             |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `thumbnail`, `resize_to_limit/fit/fill/cover` (`size: :down`, `crop: :centre`, `MAX_COORD`) | `resize({ fit, position, withoutEnlargement })`                   |
| sharpen, `SHARPEN_MASK` 3×3 scale 24 (`vips.rb:22-24`, `conv`)                              | `convolve({ width: 3, height: 3, kernel, scale: 24 })`            |
| `autorot`, `rot90/180/270`, `similarity(angle:)`                                            | `rotate()`, `rotate(n, { background })`                           |
| `resize_and_pad`, `gravity(extend:, background:)`, `add_alpha`                              | `resize({ fit: "contain", background })`, `extend`, `ensureAlpha` |
| `composite(mode:, gravity:, offset:)`                                                       | `composite([{ input, blend, gravity, top, left }])`               |
| `valid_image?`                                                                              | `sharp(path).stats()`                                             |
| `save_image(quality:, saver:)`                                                              | `toFormat(fmt, { quality })`                                      |

A queued operation that is not one of `vips.rb`'s own methods is a libvips
operation by name (`processor.rb:60`, `receiver.public_send`), which sharp does
not expose generally. Those go through an explicit name → sharp table (`invert`
→ `negate`, …); see Open questions.

### mini_magick shells out

`MiniMagick::Shell#execute` (`shell.rb:35`) is `Open3.capture3(env, *command,
stdin_data:, …)` under a timeout: `child_process.execFile` / `spawn` with the
same argv, stdin and environment, async, raising `MiniMagick::Error` /
`TimeoutError` as the gem does. ImageMagick 7's `magick` is used when found,
else the IM6 tools (`mini_magick.rb:19-27`); CI installs ImageMagick.

### Process

Each package goes marcel's way (RFC 0201): vendor, generate a starting point
with the Ruby-to-TS generator, polish on a branch, land. The generator gains
Minitest::Spec (`describe` / `it` / `before`) and RSpec support on its own
branch first; that is generator work, not stories here.

## Non-goals

- **ActiveStorage.** The consumer, its own RFC.
- **GraphicsMagick** (`MiniMagick.graphicsmagick`, `configuration.rb:12`): kept
  as configuration, not exercised in CI.
- **A ruby-vips-shaped binding** (wasm-vips): ruled out for sharp.

## Alternatives considered

- **wasm-vips**, whose API mirrors libvips operation names: rejected by the
  owner in favour of sharp.
- **A non-thenable builder** with only `call`: rejected; `await` reads as the
  trigger Ruby's `call` is.

## Rollout

1. Vendor — `vendor-image-processing-and-mini-magick`
2. mini_magick — `mini-magick-port`
3. Core — `image-processing-chainable-thenable-proxy`, `image-processing-pipeline-and-processor`
4. Backends — `image-processing-mini-magick-backend`, `image-processing-vips-backend-over-sharp`
5. Tests — `image-processing-perceptual-hash-test-helper`

## Verification

- `mini_magick`'s and `image_processing`'s ported tests pass, each skip a
  `PERMANENT-SKIP` citing a ruling here.
- `parity:api` and `parity:test` report both packages at 100%.
- CLAUDE.md's `method_missing` table has the Chainable row.

## Open questions

1. **Unmapped libvips operations.** A queued name sharp has no form for: raise
   `ImageProcessing::Error` when the pipeline runs (recommended), or
   `PERMANENT-SKIP` the tests that use one.
2. **Loader / saver option introspection** (`vips.rb:198-226`,
   `Vips::Introspect`): a static per-format option list (recommended), or pass
   every option to sharp's format call.
3. **Metadata setters** `set` / `set_type` / `set_value` / `remove`
   (`vips.rb:149-152`): map what `withMetadata` / `keepExif` express, and raise
   for the rest (recommended).
4. **The perceptual hash** `assert_similar` uses (`dhash-vips`'s IDHash): port
   IDHash over sharp's raw pixels (recommended, so distances match the gem's
   threshold of 3), or a different hash with its own threshold.

## Changelog

- 2026-10-21: initial draft
