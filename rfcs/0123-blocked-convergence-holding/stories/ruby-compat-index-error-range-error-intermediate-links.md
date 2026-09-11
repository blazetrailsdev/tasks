---
title: "ruby-compat KeyError and FloatDomainError skip Ruby's IndexError/RangeError links"
status: draft
updated: 2026-09-10
rfc: "0123-blocked-convergence-holding"
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

Surfaced by trails#7663 (`ruby-compat-errors-bypass-standarderror`), which
re-parented the ruby-compat error classes onto `StandardError`. Two Ruby
intermediate links are still flattened, because ruby-compat has no class for
the intermediate:

- `packages/ruby-compat/src/key-error.ts` — MRI:
  `KeyError.ancestors` is `[KeyError, IndexError, StandardError, ...]`
  (`vendor/ruby/error.c:3325`), but it extends `StandardError` directly.
- `packages/ruby-compat/src/float-domain-error.ts` — MRI:
  `FloatDomainError < RangeError < StandardError`
  (`vendor/ruby/numeric.c:6155`), but it extends `StandardError` directly.
  The ruby-compat `RangeError` seat was avoided because Rails declares its own
  `RangeError` (`activemodel/lib/active_model/errors.rb:523`,
  `activerecord/lib/active_record/errors.rb:301`) — those are
  `ActiveModel::RangeError` / `ActiveRecord::RangeError`, namespaced, and do
  not own Ruby core's `::RangeError`.

So `rescue IndexError` / `rescue RangeError` ports cannot catch these.

## Converged shape

Add ruby-compat `IndexError` and `RangeError` (Ruby core, extending
`StandardError`, `name` via `.prototype.name` with no constructor, as
`standard-error.ts` / `thread-error.ts` do), and re-parent `KeyError` and
`FloatDomainError` onto them.

## Acceptance criteria

- [ ] `KeyError extends IndexError`, `FloatDomainError extends RangeError`, both
      intermediates extend `StandardError`.
- [ ] `pnpm parity:api:extra:gate` stays green for ruby-compat (pinned novel 0;
      new classes carry `@noRailsEquivalent PERMANENT` receipts).
- [ ] `blazetrails/rails-error-parity` lint green.
