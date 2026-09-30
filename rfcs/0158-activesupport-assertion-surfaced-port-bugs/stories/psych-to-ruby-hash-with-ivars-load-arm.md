---
title: "Psych ToRuby revives !ruby/hash-with-ivars (to_ruby.rb:274-286)"
status: draft
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Psych revives `!ruby/hash-with-ivars[:Class]` by allocating the class (or a
plain Hash), reviving `elements` into it, and setting each `ivars` pair with
`hash.instance_variable_set accept(k), accept(v)`
(`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/to_ruby.rb:274-286`).

trails' `YAMLTree#visitHashSubclass` (`packages/activesupport/src/yaml.ts`,
trails#8273, moved onto the ivar accessors in trails#8276) dumps that tag, but
`ToRuby` has no arm for it, so a dumped Hash subclass with ivars does not load
back.

## Converged shape

A `ToRuby` arm for `/^!ruby\/hash-with-ivars(?::(.*))?$/` mirroring
`to_ruby.rb:274-286`: `resolveClass($1)` allocate or `{}`, `register`,
`reviveHash` for `elements`, and `rbObjIvarSet(hash, accept(k), accept(v))` for
each `ivars` pair (the key is a Symbol, `":@foo"`, so strip the colon).

## Acceptance criteria

- [ ] `unsafeLoad(dump(h))` round-trips a `HashWithIndifferentAccess` subclass carrying an ivar.
- [ ] `yaml.trails.test.ts` covers the load arm.
