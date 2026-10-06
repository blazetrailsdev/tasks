---
title: "Parameters' eleven alias_method names are delegating wrappers, two of them inverted"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8584
claim: "2026-10-06T15:47:21Z"
assignee: "message-pack-serializer-load-raises-runtime-error"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`
declares eleven aliases besides `required` on `ActionController::Parameters`:

- `:253-255` `has_key?`, `key?`, `member?` alias `include?`
- `:384` `to_param` aliases `to_query`
- `:398` `to_unsafe_hash` aliases `to_unsafe_h`
- `:410` `each` aliases `each_pair`
- `:872` `without` aliases `except`
- `:957` `keep_if` aliases `select!`; `:970` `delete_if` aliases `reject!`
- `:1038` `with_defaults` aliases `reverse_merge`; `:1046` `with_defaults!`
  aliases `reverse_merge!`

`packages/actionpack/src/action-controller/metal/strong-parameters.ts` ports
each as a second method with a delegating body (`without(...keys) { return
this.except(...keys) }`), which adds a call the alias does not make. Two are
inverted: `toUnsafeH` delegates to `toUnsafeHash` and `eachPair` delegates to
`each`, where Rails defines `to_unsafe_h` and `each_pair` and aliases the other
name. `hasKey` / `isKey` call ruby-compat's `hasKey` while `include` / `member`
use `in`, so the four names Rails binds to one body have two.

trails#8563 ported `required` as the alias shape:
`declare required: Parameters["require"]` in the class and
`Parameters.prototype.required = Parameters.prototype.require` after it.

## Acceptance criteria

- [ ] Each of the eleven names is the same function object as its Rails
      original, assigned on the prototype as `required` is, with the body on
      the name Rails defines (`toUnsafeH`, `eachPair`, `include`).
- [ ] A `.trails.test.ts` case pins the identity of each pair.
- [ ] `pnpm parity:api --package actioncontroller` still reports
      `metal/strong_parameters.rb` 115/115.
