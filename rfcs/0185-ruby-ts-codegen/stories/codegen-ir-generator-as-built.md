---
title: "The IR generator as built: Prism IR, gem index, oracle-typed lowering, activejob pilot"
status: in-progress
updated: 2026-10-17
rfc: "0185-ruby-ts-codegen"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 2500
priority: 1
pr: trails#9004
claim: "2026-10-17T20:14:20Z"
assignee: "codegen-ir-generator-as-built"
blocked-by: null
closed-reason: null
---

## Context

RFC 0185 designed a generator with a TypeScript-checker call resolver fed by a
hint sidecar (trace recorder plus model pass), a declaration skeleton, and a
`pnpm codegen*` CLI. The generator built and piloted in trails#9004 took a
different route, for the reasons that PR's measurements give:

- Ruby is parsed by Prism into a normalized IR (`scripts/codegen/ruby/build-ir.rb`)
  that keeps Ruby semantics (truthiness, symbols, kwargs, blocks) as node kinds.
- A gem index (`scripts/codegen/src/gem-index.ts`) records every scope, def,
  macro, attr, include and constant. A resolver (`resolve.ts`) maps Ruby
  constants to trails exports, `TopLevel` seats and namespace autoloads.
- Types come from an oracle extracted from the hand port (`hand-oracle.ts`),
  not from a checker over a sidecar. A hand-ported twin decides async-ness,
  getter versus method, and spelling.
- Lowering (`lower.ts`) and emission (`emit.ts`) handle mixins, `super`
  (including inlining a module's `initialize`), and the async fixpoint (`cli.ts`
  passes until no def turns async). Ported Minitest files run on activesupport's
  `testing/autorun`.

trails#9004 is about 9,600 lines of generator source and tests. This RFC's PR size ceiling is lifted so the generator lands working, so `est-loc` holds the per-story cap and the real size is recorded here.

Measured on #9004's head:

| Gem                                                               | tsc errors | Call-parity              |
| ----------------------------------------------------------------- | ---------- | ------------------------ |
| activerecord                                                      | 438        | 2263 identical call sets |
| activejob (swapped into `packages/activejob/src`, inline adapter) | 13         | 166/213 tests pass       |

## Acceptance criteria

- [x] Generator source under `scripts/codegen/src`, the Prism IR builder, and
      the measurement scripts (`measure-all.sh`, `measure-parity.sh`,
      `swap-tree.sh`).
- [x] `scripts/codegen/src` is registered in CI (Unit Tests path filter,
      vitest include and aliases) and imports the scripts toolchain's
      `typescript-5`.
- [x] Unit tests for the lowering rules, constant renames and the runtime shim,
      each lowering-rule test verified to fail against the generator before it.
- [x] Every runtime-shim helper cites its MRI source in `SHIM_SOURCES`.
- [x] The activejob pilot is reviewable as trails#9005 (the generated tree in
      place of the hand port; never merged).

## Follow-up

These stories carry what the original stories asked for that #9004 did not
deliver:

- shim removal: `ruby-compat-kernel-raise-for-codegen`,
  `ruby-compat-extract-keywords-for-codegen`,
  `rb-f-send-dispatches-operators-for-codegen`,
  `ruby-compat-enumerable-sort-by-inject-tally`,
  `codegen-backrefs-bind-the-match-natively`,
  `codegen-instance-exec-and-class-eval-native`,
  `codegen-singleton-public-methods-without-shim`;
- `class-to-string-renders-ruby-module-to-s` (RFC 0154);
- `codegen-activejob-typechecks-strict`.
