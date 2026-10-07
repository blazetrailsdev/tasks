---
title: "Exception#detailed_message is assigned onto the prototype from another module"
status: draft
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8619 ported `Exception#detailed_message` (`exc_detailed_message`,
`vendor/ruby/v3.3.11/error.c:1657`; `rb_decorate_message`,
`vendor/ruby/v3.3.11/eval_error.c:128`) into
`packages/ruby-compat/src/exc-detailed-message.ts`. The method is not written in
`class Exception`'s body:

- `exc-detailed-message.ts` ends with
  `Exception.prototype.detailedMessage = excDetailedMessage`, and
  `packages/ruby-compat/src/exception.ts` types it through a merged
  `interface Exception` under a file-level
  `eslint-disable @typescript-eslint/no-unsafe-declaration-merging`.
- The cause is an import cycle. The body needs `rb_class_name` (`rbModToS` in
  `object.ts`), and `object.ts` imports `TypeError`, `NameError`, `FrozenError`
  and `NoMethodError`, each of which extends `Exception`. An import of
  `object.ts` from `exception.ts` leaves `Exception` in TDZ when a subclass
  module is the entry.
- A module that loads `exception.js` without `exc-detailed-message.js` gets an
  `Exception` with no `detailedMessage`. Today only `index.ts` guarantees both
  load.

## Acceptance criteria

- `detailedMessage` is a method in `class Exception`'s body, with no interface
  merge and no lint disable in `exception.ts`.
- `exception.ts` loads as an entry module of the built `dist/` with a plain-node
  import, and so does each error subclass module.
- `exc-detailed-message.trails.test.ts` still passes.
