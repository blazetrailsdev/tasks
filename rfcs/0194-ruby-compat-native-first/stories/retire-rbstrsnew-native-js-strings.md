---
title: "Retire rbStrSNew: String.new ports as a native JS string, credited by the gate"
status: done
updated: 2026-10-20
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: ["ruby-compat", "activemodel", "rack", "rack-test", "trailties", "activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9137
claim: "2026-10-20T15:56:28Z"
assignee: "retire-rbstrsnew-native-js-strings"
blocked-by: null
closed-reason: null
---

## Context

Repo-owner ruling, 2026-10-20: **`rbStrSNew` is retired. A Ruby `String.new` ports as a
native JS string — the literal `""`, or the value itself — everywhere.** Dean: "I don't
want this in ruby-compat, we should use and expect native js strings everywhere,
rbStrSNew is bleeding into everything."

`rbStrSNew` (`packages/ruby-compat/src/string/support.ts:51`) is the identity function
`return str`. It carries no MRI semantics a JS string lacks — CLAUDE.md
§ "Ruby Strings are JS string primitives" already rules that a Ruby String IS a JS
string primitive, so `String.new(x)`'s copy is the value. The helper exists almost
entirely to earn call-gate credit for `String.new`, via the
`["String.new", { tsExport: "rbStrSNew", receiver: "string" }]` row in
`RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` (`scripts/parity/ruby-compat.ts:138`). That is the
bleed: an inert wrapper spreading across seven packages to satisfy a measurement.

Live call sites (7):

| Site                                                    | Converges to          |
| ------------------------------------------------------- | --------------------- |
| `packages/activemodel/src/type/string.ts:28`            | `value`               |
| `packages/rack/src/mock-response.ts:45`                 | `""`                  |
| `packages/rack/src/multipart/parser.ts:233`             | `""`                  |
| `packages/rack/src/multipart/parser.ts:434`             | `""`                  |
| `packages/rack/src/multipart/parser.ts:542`             | `""`                  |
| `packages/rack-test/src/cookie-jar.ts:201`              | `""`                  |
| `packages/trailties/src/thor/actions/create-file.ts:53` | `await this.render()` |

Plus `packages/activerecord/src/serialized-attribute.test.ts:18,690`, the export at
`packages/ruby-compat/src/index.ts:427`, and `scripts/parity/ruby-compat.test.ts:106-108`.

**The gate change is the point of the story, not a side effect.** Deleting the helper
without it converts the bleed into a `@missingRailsCall new — PERMANENT` receipt at each
of the seven sites — the same debt in a different register, and exactly the complaint in
`rack-test-uploaded-file-append-to-receipt-prose` (RFC 0193), whose
"converge onto `rbStrSNew`" arm this story falsifies.

The mechanism already exists and needs only widening.
`isCoreNewWithNoNewExpression` (`scripts/api-compare/compare.ts:849-860`) already drops
`new` from significance when every `new` site in the Ruby body has a receiver kind whose
faithful port is not a `new` expression. Its `literal-new` arm credits
`Hash.new` / `Array.new` → `{}` / `[]` unconditionally. Its `string-new` arm credits
`String.new(x)` only against a TS body making the `String(x)` conversion call
(`tsNativeForms.has("String")`), which a bare `""` literal and a bare passthrough do not
satisfy. Since a JS string is the port of a Ruby String by ratified rule, `string-new`
has no TS form that could prove more than `literal-new` does: credit it
unconditionally, matching the `literal-new` arm.

## Acceptance criteria

- [ ] `isCoreNewWithNoNewExpression`'s `string-new` arm credits unconditionally, as
      `literal-new` does; its doc comment (`compare.ts:831-848`) is updated to say the
      faithful port of `String.new` is a JS string, with no native-form proof required.
- [ ] `rbStrSNew` is deleted from `packages/ruby-compat/src/string/support.ts` and from
      the `packages/ruby-compat/src/index.ts:427` export list.
- [ ] The `String.new` row is removed from `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`
      (`scripts/parity/ruby-compat.ts:138`), and `scripts/parity/ruby-compat.test.ts:106-108`
      is updated to assert `String.new` resolves to no ruby-compat alias.
- [ ] All 7 call sites above, and the `serialized-attribute.test.ts` use, are rewritten to
      the native form. No site gains a `@missingRailsCall`, `@missingRailsArgs` or baseline
      row in exchange.
- [ ] CLAUDE.md § "Ruby Strings are JS string primitives" is amended: the bullet reading
      "`Type::String#cast_value`'s `::String.new(value)` is ruby-compat's `rbStrSNew` …"
      (CLAUDE.md:1183-1185) is rewritten to state that `String.new` ports as the JS string
      itself, with no helper.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green, and no
      `call-mismatches-exclude` row is added.
- [ ] `pnpm parity:api:extra:gate` is green: ruby-compat's row shrinks by one receipted
      member, so `pnpm parity:api:extra:tighten` is run.
- [ ] `rack-test-uploaded-file-append-to-receipt-prose` is reported back for closure as
      `FALSIFIED:` (its convergence target no longer exists) — do not close it from the PR.
