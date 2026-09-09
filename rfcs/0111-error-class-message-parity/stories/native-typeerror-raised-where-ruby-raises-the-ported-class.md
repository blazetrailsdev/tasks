---
title: "class_attribute and Range#overlap raise the JS global TypeError, not the ported Ruby one"
status: ready
updated: 2026-09-09
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 11
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two ActiveSupport raise sites still construct the JS global `TypeError` and
carry a `// eslint-disable-next-line blazetrails/rails-error-parity` to survive
the lint, where Ruby raises its own `TypeError`:

- `packages/activesupport/src/class-attribute.ts:59-60` —
  `raise TypeError, "#{name.inspect} is not a symbol nor a string"`
  (`vendor/rails/activesupport/lib/active_support/core_ext/class/attribute.rb:92`)
- `packages/activesupport/src/core-ext/range/overlap.ts:30-31` —
  `raise TypeError unless other.is_a? Range`
  (`vendor/rails/activesupport/lib/active_support/core_ext/range/overlap.rb:9`)

The ported class already exists — `TypeError` in
`packages/ruby-compat/src/type-error.ts`, which deliberately extends
`globalThis.Error` rather than the native `TypeError` so callers can rescue it
by class the way Ruby does. A caller rescuing the ported class misses both of
these; they are indistinguishable from a genuine JS runtime fault.

Surfaced by PR #7589 (`shared-ruby-typeerror-mirror`), which converged the
three raise sites the story named and removed their now-dead suppressions.
These two were left because they raise the global deliberately, which is a
separate decision from the mirror consolidation.

Note `rails-error-parity` accepts an imported name that shadows the native
constructor (`ImportSpecifier` -> `importedNames` in
`eslint/rails-error-parity.mjs`), so importing the ported class removes the
suppression with no rule change and no baseline row.

## Converged shape

Both sites import `TypeError` from `@blazetrails/ruby-compat` and raise it, and
both `eslint-disable-next-line blazetrails/rails-error-parity` comments are
deleted.

`overlap.ts` raises with no message, matching `overlap.rb:9`.

## Acceptance criteria

- [ ] Neither file constructs the JS global `TypeError`.
- [ ] Neither file carries a `rails-error-parity` suppression, and no baseline
      row is added.
- [ ] `error instanceof TypeError` (the ported class) holds at both sites.
- [ ] Message strings unchanged.
