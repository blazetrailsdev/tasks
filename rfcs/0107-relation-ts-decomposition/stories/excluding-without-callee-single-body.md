---
title: "Keep one excluding body across the without alias without a __callee__ helper"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6627
claim: "2026-08-17T02:22:52Z"
assignee: "converge-parameter-filter-ignore-case-onto-inline-group"
blocked-by: null
closed-reason: null
---

## Context

Shipped in #6618 (`inline-relation-where-family-private-helpers`), where the invented
`_excludingArgs` helper was inlined into `excluding`.

Rails writes ONE body plus an alias (`activerecord/lib/active_record/relation/query_methods.rb:1574-1585`):

```ruby
def excluding(*records)
  ...
  raise ArgumentError, "You must only pass a single or collection of #{model.name} objects to ##{__callee__}."
  ...
end
alias :without :excluding
```

`__callee__` names whichever alias was actually called, and the ArgumentError message
depends on it — `activerecord/test/cases/excluding_test.rb:103-110` asserts `#excluding`
from one entry point and `#without` from the other.

TypeScript has no `__callee__`, and a true prototype alias (one function under two names)
cannot recover the invoked name. #6618 chose to materialize the body once per callee, so
`packages/activerecord/src/relation.ts` now carries ~30 duplicated lines in `excluding`
and `without`. That is faithful to Ruby's runtime behaviour but duplicated by hand: a
future fix to one body can silently miss the other.

The prior shape — a shared `_excludingArgs(records, callee)` private — was the invented
decomposition #6618 removed, so reverting to it is NOT the answer.

## Converged shape

Find a shape that keeps ONE body and still names the invoked callee in the message, so
`excluding`/`without` stay a single ported method plus an alias, as at
query_methods.rb:1585. Options to evaluate (none prejudged):

- a per-callee wrapper generated from one implementation, so there is one authored body;
- deriving the callee at the throw site without a helper Rails lacks;
- accepting the duplication permanently and pinning it with a test that both bodies stay
  in step.

Whatever is chosen, the deviation must be justified at the call site as a genuine
TypeScript language shortcoming, per CLAUDE.md.

## Acceptance criteria

- [ ] `excluding` and `without` no longer carry two hand-maintained copies of the
      query_methods.rb:1574-1584 body.
- [ ] Both ArgumentError messages still match `excluding_test.rb:105` (`#excluding`) and
      `:108` (`#without`); `excluding.test.ts` passes with its Rails test names unchanged.
- [ ] No shared private helper Rails does not have is reintroduced.
- [ ] `pnpm parity:api:calls` / `:args` green; `parity:api:extra` for `relation.ts` does
      not grow.
