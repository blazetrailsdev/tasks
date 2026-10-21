---
rfc: "0000-marcel-port-to-100"
title: "Marcel: from the generated port to 100%"
status: active
created: 2026-10-21
updated: 2026-10-21
owner: "@deanmarano"
packages:
  - marcel
clusters:
  - marcel-land
  - marcel-polish
  - marcel-parity
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Marcel: from the generated port to 100%

## Summary

trails has no port of the marcel gem (MIME type detection, `vendor/marcel/v1.0.4`,
resolved by `vendor/rails/v8.0.2/Gemfile.lock:344`). The Ruby-to-TS generator
(trails branch `codegen-native-inference`, `scripts/codegen`) emitted one, and the
trails branch `marcel-port` holds it as a starting point: the gem's lib, its
tests as plain vitest, and its test fixtures. This RFC takes that tree to a
hand-quality package on `main`: in CI, typecheck-clean, faithful in the shape
CLAUDE.md requires, and at 100% on `parity:api` and `parity:test`.

## Motivation

State of `marcel-port` at `3b165e0d11`:

- 365 of 374 tests pass. 6 fail (magic-byte detection, binary String bytes), 3
  skip (one `PERMANENT-SKIP`, two `skipIf` arms Ruby never defines).
- `tsc -p packages/marcel` reports 55 errors.
- `codegen-runtime.ts` (`rbBinop`, one call at `magic.ts:145`) and
  `codegen-declined.ts` are generator artifacts a hand port does not ship.
- Untyped calls lower to inline dispatch lambdas (`x instanceof Set || … ?
[...x] : Object.entries(x)`), `rbStrSend(…, "get", new Range(…))` slices and
  `rbEqual` on strings: 21 in `magic.ts`, 9 in `mime-type.ts`, 11 in
  `test-helpers/test-helper.ts`. CLAUDE.md asks for the native form wherever
  the receiver's type is known.
- `vendor/sources.ts` registers marcel with `compareApi: false` and
  `compareTests: false`, so no parity gate sees it yet.

marcel is small (lib ~500 lines before the 4,815-line generated `tables.ts`),
which makes it the first gem to go from generated to finished, and the diff
from generated to finished is a record of what the generator should emit next.

## Design

Work on top of `marcel-port`. The first story lands it on `main` with CI
registration, so every later story is an ordinary PR from `main`.

- **Land.** The package, its vendor source, its fixtures (byte-for-byte copies
  of `vendor/marcel/v1.0.4/test/fixtures`, already exempt from the
  control-byte, eslint and prettier checks, `binary` in `.gitattributes`), and
  every registration a new package needs (`ci.yml`, workspace, tsconfig
  references, guard fixtures).
- **Polish.** Drop the generator artifacts, then converge each lib body to its
  Ruby counterpart in the native form (CLAUDE.md "Fidelity is the job", "Ruby
  idioms that do not translate literally"), with real types, then the tests.
- **Parity.** Turn on `compareApi` / `compareTests` and take both to 100%,
  with the call, argument, parameter-name and extra-surface gates green.
- **Byte strings.** The magic-byte tests wait on
  `binary-string-bytesize-counts-bytes` (the owner ruling that `String#b` is a
  `Uint8Array`), then converge marcel's `magic_match_io` against it.

A polish story that finds a pattern the generator could have emitted records
it in its PR body, so the generator can learn it; it does not regenerate.

## Non-goals

- **Regenerating marcel.** Once on `main` the package is hand-maintained.
- **Rack 2's `Rack::Lint::InputWrapper`.** marcel's test targets rack 2
  (`marcel.gemspec:25`); trails ports rack 3.1.14, where the class is
  `Rack::Lint::Wrapper::InputWrapper`. The test stays a `PERMANENT-SKIP`.
- **Consumers** (ActiveStorage's content-type detection): their own RFCs.

## Alternatives considered

- **Keep marcel generated and fix the generator until it is clean.** Slower to
  a usable package, and it couples marcel to the spike branch's lifetime.

## Rollout

1. Land — `marcel-land-on-main`
2. Polish — `marcel-drop-codegen-shims`, `marcel-lib-native-idioms`,
   `marcel-tests-native-and-typed`, `marcel-typecheck-clean`
3. Parity — `marcel-parity-enrollment`
4. Byte strings — `marcel-magic-bytes-match-binary-io`

## Verification

- 371 of 374 marcel tests pass; the 3 left are the `PERMANENT-SKIP` above and
  nothing else (the two `skipIf` tests Ruby never defines are gone).
- `tsc -p packages/marcel` reports 0 errors, and no `any`.
- `parity:api` and `parity:test` report marcel at 100%, every gate green.
- No `codegen-runtime.ts` or `codegen-declined.ts` in `packages/marcel`.

## Open questions

None.

## Changelog

- 2026-10-21: initial RFC
