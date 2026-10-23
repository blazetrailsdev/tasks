---
title: "vitest-matchers: toBeKindOf ports assert_kind_of for primitives and modules"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: assertion-tooling
packages: [vitest-matchers]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC 0206 § "Matchers". Minitest's `assert_kind_of cls, obj` is
`obj.kind_of? cls` (`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:282-287`;
`refute_kind_of` `:721-726`), used 464 times across Rails' test suites
(`grep -rhoE '\bassert_kind_of\b' vendor/rails/v8.0.2/*/test | wc -l`).
The built-in `toBeInstanceOf` gets two cases wrong: a JS primitive
(`expect("x").toBeInstanceOf(String)` fails, where Ruby `"x".kind_of?(String)`
is true), and a module in the receiver's ancestry (`kind_of?(Comparable)`),
which `instanceof` cannot see. The Minitest helper being deleted,
`assertKindOf` (`packages/activesupport/src/testing/assertions.ts:942-954`),
boxes with `Object(obj) instanceof cls`.

## Acceptance criteria

- [ ] `packages/vitest-matchers/src/index.ts` adds `toBeKindOf(cls)`, which
      passes when ruby-compat's `rbObjIsKindOf(received, cls)`
      (`packages/ruby-compat/src/include.ts`, MRI `rb_obj_is_kind_of`,
      `vendor/ruby/v3.3.11/object.c:889`) is true. That one call is the
      module check: it walks the singleton and class ancestry, so a module
      `include`d or `extend`ed is found, a primitive is answered through
      `rbObjClass`, and `null` / `undefined` never reach `.constructor`. No
      separate class-vs-module test is written. Its message follows
      Minitest's `"Expected #{mu_pp(obj)} to be a kind of #{cls}, not #{obj.class}"` (`:284-285`).
- [ ] `TRAILS_MAP` in `scripts/test-compare/assertion-kinds.ts` maps
      `toBeKindOf` to `kindOf`; `NEGATION` gains `kindOf ↔ notKindOf` and
      `RAILS_MAP` gains `refute_kind_of: "notKindOf"`, so `.not.toBeKindOf`
      and the existing `.not.toBeInstanceOf` (which today fold to `kindOf`
      through `NEGATION[kind] ?? kind`, `:381`) score `notKindOf` against
      Rails' `refute_kind_of`. `assertion-kinds.test.ts` covers the
      positive and negated pairs, and the PR body reports
      `pnpm parity:test` `kind` counters before/after (they only fall).
- [ ] `src/index.test.ts` covers a primitive (`"x"` kind of `String`), a
      subclass instance, an included module, `null` (kind of ruby-compat's
      `rbCNilClass`, `packages/ruby-compat/src/object.ts:325`, and of no
      model class), and the negated form.
- [ ] CONTRIBUTING.md § "Porting a Minitest assertion" names `toBeKindOf` in
      the `assert_kind_of` row for the primitive / module case.
