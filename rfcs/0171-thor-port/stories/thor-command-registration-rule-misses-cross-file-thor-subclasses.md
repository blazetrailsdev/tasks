---
title: "thor-command-registration: name the generator bases so cross-file Thor subclasses are checked"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps:
  - rebase-generator-base-onto-thor-group
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

`blazetrails/thor-command-registration` (trails#8477, `eslint/thor-command-registration.mjs`) reads a
class's `extends` chain within one file. A subclass of a Thor class imported from another file is only
checked when its base is named in the rule's `baseClasses` option, which `eslint.config.mjs` leaves
unset. No trailties generator extends the Thor port today, so nothing is missed yet; once the
generator stories in this RFC put `Rails::Generators::Base` / `NamedBase` on `Thor::Group`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:17`), every generator is a cross-file
subclass and an unregistered step is silently never run.

The rule also ignores a `methodAdded(NAME)` whose argument is not a string literal, and reports the
method (documented in its JSDoc).

## Acceptance criteria

- [ ] When `Rails::Generators::Base` extends the Thor port, the trailties block in `eslint.config.mjs`
      passes `baseClasses` naming the generator and command bases (`Base`, `NamedBase`,
      `Rails::Command::Base`'s port), or the rule resolves an imported base without a list.
- [ ] `pnpm eslint packages/trailties/src` is green with the option set, with every generator step
      registered in definition order.
