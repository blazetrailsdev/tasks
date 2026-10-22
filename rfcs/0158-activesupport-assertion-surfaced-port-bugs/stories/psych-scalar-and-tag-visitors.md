---
title: "Psych: the remaining YAMLTree / ToRuby arms (Rational, Complex, BigDecimal, Exception, Encoding)"
status: ready
updated: 2026-09-29
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["ruby-compat"]
deps:
  ["move-activesupport-yaml-into-ruby-compat-psych", "psych-load-tags-dump-tags-and-domain-types"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`psych-object-protocol-for-record-yaml-round-trip` ported the object half of
Psych, and RFC 0170 (psych-in-ruby-compat) has since moved it into
`packages/ruby-compat/src/psych/` and ported most of the dispatch tables.
`YAMLTree` (`packages/ruby-compat/src/psych/visitors/yaml-tree.ts`) now has
`visitTime`, `visitDateTime`, `visitDate`, `visitSymbol`, `visitString`,
`visitInteger`, `visitFloat`, `visitRange`, `visitRegexp`, `visitStruct`,
`visitHashSubclass` and the omap / Class arms; `ToRuby`
(`visitors/to-ruby.ts`) revives `!ruby/regexp`, `!ruby/range`,
`!ruby/sym`, `!ruby/struct`, `!ruby/object`, `!ruby/hash:` and `!omap`; and
`Psych::Coder` has `representScalar` / `representSeq` / `representObject`
(`psych/coder.ts:91-124`).

Still unported, each falling through to the generic arm:

- `YAMLTree` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb`):
  `visit_Encoding` (`:147`), `visit_Exception` / `visit_NameError`
  (`:182-188`), `visit_Rational` (`:210`), `visit_Complex` (`:223`),
  `visit_BigDecimal` (`:250`).
- `ToRuby#deserialize` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/to_ruby.rb`):
  `!ruby/object:BigDecimal` (`:77`), `!ruby/encoding` (`:86`),
  `!ruby/object:Complex` (`:88`), `!ruby/object:Rational` (`:91`), and the
  mapping arms for `Rational` / `Complex` (`:208-211`) and `!ruby/exception`.

The `!ruby/hash-with-ivars` load arm is its own story,
`psych-to-ruby-hash-with-ivars-load-arm`.

## Acceptance criteria

- [ ] Each arm above is ported at its Psych name in
      `packages/ruby-compat/src/psych/visitors/`, with its `yaml_tree.rb` /
      `to_ruby.rb` citation, or raises where the value has no trails
      counterpart, instead of falling through.
- [ ] A round-trip test per arm in ruby-compat's `psych-*.test.ts` /
      `psych.trails.test.ts`.
