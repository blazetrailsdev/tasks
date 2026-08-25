---
title: 'Error types are Symbols: spell them ":blank", not identifier-shaped strings'
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps:
  - proc-message-resolves-through-i18n
deps-rfc: []
est-loc: 350
priority: null
pr: 6098
claim: "2026-08-04T22:35:00Z"
assignee: "error-type-symbols-are-colon-strings"
blocked-by: null
closed-reason: null
---

# Error types are Symbols: spell them `":blank"`, not identifier-shaped strings

## Context

`packages/activemodel/src/error.ts` decides whether an error's `rawType` is a
Ruby Symbol (look the key up through I18n) or a String (use it as the literal
message) with a regex:

```ts
const IDENTIFIER_RE = /^[a-z][a-zA-Z0-9_]*$/;
```

Rails has the type itself: `Error#message` is
`@raw_type.is_a?(Symbol) ? self.class.generate_message(...) : @raw_type`
(`vendor/rails/activemodel/lib/active_model/error.rb:136-141`), and
`Errors#add` keeps `type` as whatever the caller passed
(`activemodel/lib/active_model/errors.rb:333`).

The regex gets it wrong in both directions, and Rails has tests that prove it:
`errors.add attr, "gotcha"` asserts `%w(gotcha gotcha)`
(`activemodel/test/cases/validations_test.rb:113-120`) — a one-word String is a
literal message in Rails and an i18n key lookup in trails. PR 6026 hit this
twice; both cases had to be reworded to multi-word literals because the shim's
old backend returned the key on a miss, which accidentally made the two arms
look alike. With the real gem a miss now returns
`"Translation missing: en.errors.messages.gotcha"`, so the divergence is
user-visible.

CLAUDE.md's settled idiom is already in the tree for the sibling case: a Ruby
Symbol value is a JS string that keeps its leading colon (`":blank"`), and
`Error.generateMessage` uses exactly that for the `message:` option since
PR 6026.

## Acceptance criteria

- `Error#message` dispatches on `rawType.startsWith(":")`, not `IDENTIFIER_RE`;
  `IDENTIFIER_RE` is deleted.
- Every `errors.add` / `generateMessage` caller in `packages/` that means a
  Symbol type passes the colon form (`"blank"` -> `":blank"`), including the
  validators and the association builders.
- `validations_test.rb`'s `test_validates_each` cases are restored to Rails'
  literal `"gotcha"` payload and pass, as do the two cases PR 6026 reworded
  (`packages/activemodel/src/validations.test.ts` "validates each custom
  reader" / "validates an undeclared getter via the send default", and
  `i18n-validation.test.ts` "errors full messages uses format", which Rails
  asserts as `["Field Name empty"]`).

Sibling of `i18n-symbol-values-are-colon-strings`, which converges the same
class inside `packages/i18n`.
