---
rfc: "0000-mini-magick-port-to-100"
title: "mini_magick: from the generated port to 100%"
status: active
created: 2026-10-22
updated: 2026-10-22
owner: "@deanmarano"
packages:
  - mini-magick
  - ruby-compat
  - vitest-matchers
clusters:
  - mini-magick-prereqs
  - mini-magick-land
  - mini-magick-runtime
  - mini-magick-polish
  - mini-magick-parity
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — mini_magick: from the generated port to 100%

## Summary

trails has no port of the mini_magick gem (ImageMagick command lines,
`vendor/mini_magick/v5.2.0`, resolved by `vendor/rails/v8.0.2/Gemfile.lock:352`
and depended on by image_processing, Active Storage's variant processor). The
Ruby-to-TS generator (trails branch `codegen-native-inference`,
`scripts/codegen`) emitted one, and the trails branch `mini-magick-port` holds it
as a starting point: the gem's lib, its RSpec specs as plain vitest, and its spec
fixtures. This RFC takes that tree to a hand-quality package on `main`: in CI,
running its specs against a real ImageMagick, typecheck-clean, faithful in the
shape CLAUDE.md requires, and at 100% on `parity:api` and `parity:test`. It is
the second gem after marcel (the `marcel-port-to-100` RFC) to go this way.

It replaces the single `mini-magick-port` story of the `image-processing-port`
RFC with a plan of its own; that RFC's mini_magick backend builds on this one.

## Motivation

State of `mini-magick-port` at `5f96afb0a0` (on `main` at `a60ba7d278`):

- `packages/mini-magick/src`: 9 lib files (`mini-magick.ts`, `configuration.ts`,
  `image.ts`, `image/info.ts`, `shell.ts`, `tool.ts`, `utilities.ts`,
  `version.ts`, `namespaces.ts`) for the gem's ~1,280 lib lines, and 5 spec
  files with 138 examples (`image.test.ts` 98, `tool.test.ts` 22,
  `shell.test.ts` 15, `utilities.test.ts` 2, `mini-magick.test.ts` 1), the same
  137 `it`s RSpec counts plus one.
- No spec file loads: `tool.rb:271` calls `deprecate_constant` at load, and
  ruby-compat has no `Module#deprecate_constant`. With that call and
  `File.executable?` (`utilities.rb:20`) stubbed in a local copy, 5 of the 40
  examples that load pass; `image.test.ts` stops at `MiniMagick.identify`, the
  tool shortcuts `mini_magick.rb:25-30` defines with `define_singleton_method`.
- `tsc -p packages/mini-magick` reports 463 errors.
- `codegen-runtime.ts` and `codegen-declined.ts` are generator artifacts, and the
  lib imports `@blazetrails/activesupport` (for `ENV`, `Benchmark`), a
  dependency the Ruby gem does not have.
- `Shell#execute` (`shell.rb:29-40`) calls `Open3.capture3`; ruby-compat's
  `Open3` has only `capture2e`, and nothing above `execute` is async yet.
- The branch carries two commits the package needs and `main` lacks:
  `RUBY_VERSION` in ruby-compat (`b060c71f74`) and twelve RSpec matchers in
  `@blazetrails/vitest-matchers` (`9c7181ec6f`: `toChange`, `toYieldWithArgs`,
  `toOutput`, `toInclude`, …), which the generated specs call.
- Five hand edits sit on top of the generated tree, all for lint; the commit
  message of `5f96afb0a0` lists them.
- `vendor/sources.ts` registers mini_magick with `compareApi: false` and
  `compareTests: false`.

## Design

Work on top of `mini-magick-port`. Two ruby-compat gaps and the matcher set
land first from `main`, so that the package lands with its specs loading.

- **Prerequisites.** The RSpec matchers, `Module#deprecate_constant` and
  `File.executable?`, and `Open3.capture3`, each in its own package at its Ruby
  citation.
- **Land.** The package, its vendor source, its fixtures (byte-for-byte copies of
  `vendor/mini_magick/v5.2.0/spec/fixtures`, already exempt from the
  control-byte, eslint and prettier checks and `binary` in `.gitattributes`),
  every registration a new package needs (`ci.yml`, workspace, tsconfig
  references, guard fixtures), and ImageMagick on the CI runner.
- **Runtime.** Make mini_magick work as Ruby's does: the CLI tool shortcuts, the
  `method_missing` dispatch of `Tool` and `Image`, and `Shell#execute` over
  `child_process` through `Open3.capture3`, with every caller above it async
  (ruled 2026-10-21 in the `image-processing-port` RFC: it shells out as Ruby
  does).
- **Polish.** Drop the generator artifacts and the activesupport dependency,
  converge each lib body to its Ruby counterpart in the native form (CLAUDE.md
  "Fidelity is the job", "Ruby idioms that do not translate literally"), then the
  specs, then typecheck.
- **Parity.** Turn on `compareApi` / `compareTests` and take both to 100%,
  with the call, argument, parameter-name and extra-surface gates green.

A story that finds a pattern the generator could have emitted records it in its
PR body, so the generator can learn it; it does not regenerate.

## Non-goals

- **Regenerating mini_magick.** Once on `main` the package is hand-maintained.
- **GraphicsMagick in CI.** `MiniMagick.graphicsmagick` stays configuration, and
  its specs run through the stubs the RSpec suite uses.
- **image_processing.** Its own RFC (`image-processing-port`).

## Alternatives considered

- **Keep mini_magick generated and fix the generator until it is clean.** Slower
  to a usable package, and it couples mini_magick to the spike branch's
  lifetime. marcel took the same decision.
- **One `mini-magick-port` story, as the `image-processing-port` RFC has it.**
  It does not fit one PR: the runtime work alone (async shell, two
  `method_missing` dispatchers, the tool shortcuts) is most of the ceiling.

## Rollout

1. Prerequisites — `vitest-matchers-rspec-matchers`,
   `ruby-compat-deprecate-constant-and-file-executable`,
   `ruby-compat-open3-capture3`
2. Land — `mini-magick-land-on-main`
3. Runtime — `mini-magick-cli-tool-shortcuts`,
   `mini-magick-method-missing-proxies`, `mini-magick-shell-over-open3-capture3`
4. Polish — `mini-magick-drop-codegen-shims-and-activesupport`,
   `mini-magick-lib-native-idioms`, `mini-magick-specs-native-and-typed`,
   `mini-magick-typecheck-clean`
5. Parity — `mini-magick-parity-enrollment`

## Verification

- All 137 RSpec examples are vitest tests that pass against the CI runner's
  ImageMagick, or are `PERMANENT-SKIP`s with a CLAUDE.md citation.
- `tsc -p packages/mini-magick` reports 0 errors, and no `any`.
- `parity:api` and `parity:test` report mini-magick at 100%, every gate green.
- No `codegen-runtime.ts` or `codegen-declined.ts` in `packages/mini-magick`,
  and no `@blazetrails/activesupport` in its `package.json`.

## Open questions

1. **`Image#respond_to_missing?` answers `false`** (`image.rb:471-473`) while
   `Image#method_missing` (`image.rb:462-466`) sends every unknown name to
   `mogrify`. CLAUDE.md "Ruby protocol methods with a different JS mechanism"
   has a Proxy forward only what `respond_to_missing?` claims, which would
   forward nothing. Ruby's `false` is there to keep `Array#flatten` off the
   image (the comment at `image.rb:468-470`), the same reason `Core#to_ary` is
   unported. Does `Image`'s Proxy forward every name but the protocol probes,
   with the `respond_to_missing?` port answering `false`?

## Changelog

- 2026-10-22: initial RFC
