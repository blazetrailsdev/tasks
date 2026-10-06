---
title: "is_thor_reserved_word? compares the word as Rails does, without an inline snake_case conversion"
status: in-progress
updated: 2026-10-06
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8570
claim: "2026-10-06T12:29:47Z"
assignee: "port-base-flash-and-log-subscriber-skips"
blocked-by: null
closed-reason: null
---

## Context

`Thor::Base::ClassMethods#is_thor_reserved_word?` (`vendor/thor/v1.3.2/lib/thor/base.rb:677-680`) is

    return false unless THOR_RESERVED_WORDS.include?(word.to_s)

trails' port (`packages/trailties/src/thor/base.ts`, `isThorReservedWord`, trails#8464) keeps the Rails spellings in
`THOR_RESERVED_WORDS` (`base.rb:20-21`) but compares
the word run through an inline `replace(/[A-Z]/g, ...)` that lowercases each capital behind an underscore, so that the camelCase name a trails member
actually has (`destinationRoot`) is reserved too. That is a call Rails does not make, and it is an open-coded
`underscore`: the `thor-import-boundary` lint rule forbids importing ActiveSupport's, and ruby-compat exports none.
The same inline replace is in `rbAttr` (`packages/ruby-compat/src/object.ts`).

## Acceptance criteria

- [ ] The body is `THOR_RESERVED_WORDS.includes(rbObjAsString(word))` again, with no conversion at the call site.
      Either the constant holds the spelling trails members are named by (decided once, with the literal-parity
      consequence recorded where the tool reads it), or the caller hands in the Ruby spelling.
- [ ] `method_added`'s `is_thor_reserved_word?(meth, :command)` (`base.rb:743`) is covered by the same decision.
- [ ] Both `destinationRoot` as an argument name and as a command name raise the `RuntimeError`; test in
      `base.trails.test.ts`.
