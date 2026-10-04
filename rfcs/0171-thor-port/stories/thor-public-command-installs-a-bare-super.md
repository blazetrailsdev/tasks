---
title: "Thor public_command installs a bare super, with no invented guard or NoMethodError"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Base::ClassMethods#public_command` is
`names.each { |name| class_eval "def #{name}(*); super end", __FILE__, __LINE__ }`
(`vendor/thor/v1.3.2/lib/thor/base.rb:606-610`). The generated method is a bare `super`.

`packages/trailties/src/thor/base.ts` `publicCommand` (`:290-309`) installs a method that first tests
`typeof superMethod !== "function"` and throws a hand-built `NoMethodError`
(`super: no superclass method '<name>' for an instance of <class>`). That `if` arm and `throw` are not in the
Ruby body, and carry no `@inventedArm` receipt. Ruby 3.3's own message also quotes the name as
`` `help' ``, not `'help'`.

trails#8475 removed the same guard from `Thor.subcommandHelp` (`thor/thor.ts`, `thor.rb:641-646`) at review:
the installed method calls the superclass method directly, and a missing one surfaces as a `TypeError`, the
JS analogue.

## Acceptance criteria

- [ ] The method `publicCommand` installs calls the superclass method directly, with no guard and no
      hand-built `NoMethodError`.
- [ ] It still calls `methodAdded(name)` after installing, as `class_eval`'s `def` fires `method_added`.
- [ ] `base.trails.test.ts`'s `public_command` coverage is updated to the converged behaviour.
