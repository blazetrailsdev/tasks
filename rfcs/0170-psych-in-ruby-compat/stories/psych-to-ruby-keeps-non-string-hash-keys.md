---
title: "ToRuby revives every untagged mapping into a Hash, as revive_hash does, and converges its consumers"
status: done
updated: 2026-10-15
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: [ruby-compat, activerecord, activesupport, actionpack]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: trails#8950
claim: "2026-10-15T19:20:30Z"
assignee: "psych-to-ruby-keeps-non-string-hash-keys"
blocked-by: null
closed-reason: null
---

## Context

`Psych::Visitors::ToRuby` revives every untagged mapping as `revive_hash(register(o, {}), o)`
(`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/to_ruby.rb:169,213,315`), and `revive_hash`
(`:344-377`) stores each key as `accept(k)` returned it: `1: a` loads as `{1=>"a"}`.
`packages/ruby-compat/src/psych/visitors/to-ruby.ts` revives those three arms into a null-prototype
plain object, which stringifies every key. trails#8904 made `symbolizeNames` symbolize only String
keys (`:371`).

The repo owner ruled (trails#8904 review) that every untagged mapping becomes a ruby-compat `Hash`,
as Rails does, rather than only mappings with a non-String key. Measured on trails#8904 by switching
the three arms to `new Hash()`, 30 tests failed:

- ruby-compat (7): `psych.trails.test.ts` "round-trips plain data", "safe_dump refuses …",
  "raises on the first alias …", "honours symbolize_names and freeze", "symbolizes only String keys";
  `psych/scalar-scanner.trails.test.ts` "resolves plain scalars as Psych does …", "keeps quoted and
  block scalars Strings".
- activerecord (19): `serialized-attribute.test.ts` (both describes: with default, custom attribute
  with default, base class, from database on subclass, declared in subclass, class constraint, newly
  emptied serialized hash is changed, alias attribute, select with time zone),
  `yaml-serialization.test.ts` "roundtrip serialized column", `coders/yaml-column.test.ts` "dumps and
  loads a plain hash", "round-trips nested structures". The `Hash` class constraint, `{}` defaults
  and dirty tracking assume a plain object.
- activesupport (4): `yaml.trails.test.ts` "merges << keys …", "keeps a **proto** key as an own key",
  "dumps a Hash subclass's ivars under !ruby/hash-with-ivars …", "tags a Hash subclass without ivars
  as !ruby/hash".
- actionpack (1): `parameters/serialization.test.ts` "YAML backwardscompatible with psych 2.0.9+ format".

## Acceptance criteria

- [ ] `ToRuby`'s three untagged-mapping arms revive into `Hash` (`to_ruby.rb:169,213,315`), and
      `reviveHash` keeps each key's type (`:344-377`).
- [ ] Every test listed above passes against the Hash shape, with consumers converged rather than
      converting back to a plain object.
- [ ] `psych.trails.test.ts` pins `Psych.unsafeLoad("1: a\n")` against `ruby -ryaml`.
