---
title: "parity:api:moves scores a correctly-moved mixin member as misplaced because the host interface declares its signature"
status: draft
updated: 2026-09-03
rfc: "0127-fidelity-tooling-signals-and-hygiene"
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

Surfaced in PR #7447, which moved the seven remaining `transaction_manager`
delegates out of `AbstractAdapter`'s class body into
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts`
— the file `database_statements.rb:367-370` declares them in.

The move is complete: the class members are deleted, the implementations are
`this`-typed free functions on the `DatabaseStatements` mixin object, and
`include()` supplies them at runtime. That is the settled trails idiom for Ruby
`include` (CLAUDE.md, "Module mixins").

`parity:api:moves` reports all ten anyway:

```text
connection-adapters/abstract/database-statements.ts -> connection-adapters/abstract-adapter.ts
    openTransactions  (ActiveRecord::ConnectionAdapters::AbstractAdapter::open_transactions)
    beginTransaction  (ActiveRecord::ConnectionAdapters::AbstractAdapter::begin_transaction)
    ...
```

The cause is that a mixin member still needs a signature on the host so callers
type-check, and that signature is written as `interface AbstractAdapter { ... }`
in `abstract-adapter.ts`. The extractor counts an interface declaration as
surface in the file that holds it, so the member is measured in both files and
scored misplaced — even though nothing of it lives in `abstract-adapter.ts` any
more. The same ten rows were already there for the three delegates PR #7430
moved, so this is a property of the idiom, not of either PR.

Consequence: the story's acceptance criterion ("zero `moves` rows attributing a
`database_statements.rb` member to `abstract-adapter.ts`") is unreachable in the
shape the repo prescribes, and `parity:api:moves` over-reports by however many
mixin members are declared this way across the adapters.

This matters for `gate-the-wrong-file-moves-population`, which proposes an
only-shrink ratchet over exactly this population: gating it as measured today
would gate a false positive, and every faithful mixin move would read as a
regression.

## Converged shape

Teach the moves computation that a member whose only presence in a file is a
bodiless interface/`declare` signature is not defined there. The implementation
file is the one with the body; the interface declaration is a type-level
forward, the TS cost of Ruby's `include`, and should not count as a definition
site.

Verify by re-running `pnpm parity:api:moves --package activerecord`: the ten
`database_statements.rb -> abstract-adapter.ts` rows should disappear without
any source change, and the other four `abstract/*.ts -> abstract-adapter.ts`
groups (schema-statements 82, database-limits 5, query-cache 5, savepoints 4)
should shrink by whatever share of them is the same shape.

## Acceptance criteria

- A member declared only as a bodiless signature on the host's interface is not
  counted as living in that file by `scripts/api-compare/moves.ts`.
- The ten `transaction_manager` delegates no longer appear as moves; a test
  covers the interface-declaration-plus-mixin-body shape.
- The measured population is re-reported so
  `gate-the-wrong-file-moves-population` enrols against a number that excludes
  this false positive.
