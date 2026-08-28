---
title: "invert_transaction's block run lives in the transaction forwarder, splitting one Rails method in two"
status: in-progress
updated: 2026-08-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 7175
claim: "2026-08-28T17:46:26Z"
assignee: "invert-transaction-block-run-split-across-two-methods"
blocked-by: null
closed-reason: null
---

## Context

`invert_transaction` runs the reverted block itself, before it builds its tuple:

```ruby
# vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:186-194
def invert_transaction(args, &block)
  sub_recorder = CommandRecorder.new(delegate)
  sub_recorder.revert(&block)

  invertions_proc = proc { sub_recorder.replay(self) }

  [:transaction, args, invertions_proc]
end
```

trails splits that across two methods. `invertTransaction`
(`packages/activerecord/src/migration/command-recorder.ts:561-585`) builds the
sub-recorder and the proc but never runs the block; the run lives in the
`transaction` forwarder (`command-recorder.ts:854-873`), which awaits the block
and only then calls `record("transaction", args)` with no block.

The forcing constraint is an await point. Ruby's block is synchronous, so
`inverse_of` (`command_recorder.rb:114-123`) runs it inline; a TS block returns
a promise, and the run must COMPLETE before the `transaction` tuple is appended
— the block's statements record their inverses onto the outer recorder and have
to land first (`command_recorder.rb:187`). `record`
(`command-recorder.ts:67`) and `inverseOf` (`:121`) are sync, so the forwarder
is the only method on the path with an await.

Observable behaviour and command order match Rails. The decomposition does not:
one Rails method is spread over two TS ones, and the forwarder carries logic
`command_recorder.rb:125-132` does not generate.

## Converged shape

Make `record` and `inverseOf` async so `invertTransaction` can
`await subRecorder.revert(block)` inline and return
`["transaction", args, invertionsProc]` whole, and reduce the `transaction`
forwarder to the plain generated `record("transaction", args, block)` every
other recordable method uses.

Async `record` / `inverseOf` is the repo's settled accommodation for a sync Ruby
body that has to await in TS (the same call `isValid()` makes), not a new
deviation — the Rails names, parameter lists, branches and error sites all
survive it. The generated forwarders in
`REVERSIBLE_AND_IRREVERSIBLE_METHODS` (`command-recorder.ts:875-888`) become
promise-returning with them.

## Blast radius (measured on main, 2026-08-28)

Nothing in production calls `record` or `inverseOf` from outside
`command-recorder.ts`. `migration.ts` and
`connection-adapters/abstract/schema-statements.ts` reach the recorder only
through `revert`, `replay` and `method_missing`, all already async and awaited
(`migration.ts:1060-1063`).

The whole conversion lands in two test files, ~96 lines:

| site                                      | count |
| ----------------------------------------- | ----- |
| `command-recorder.test.ts` — `inverseOf`  | 84    |
| `command-recorder.test.ts` — `record`     | 5     |
| `invertible-migration.test.ts` — `record` | 7     |

Each is an `await` on an existing expression, or a
`expect(...).rejects.toThrow(IrreversibleMigration)` where the assertion is
currently `expect(() => ...).toThrow(...)`. No test name changes.

A `grep` for `.record(` / `.inverseOf(` across `packages/` returns ~150 hits,
but the overwhelming majority are `Reflection#inverse_of`
(`reflection.ts`, `autosave-association.ts`, `inverse-associations.test.ts`) and
`ErrorReporter#record` (`activesupport/error-reporter*.ts`,
`controller-runtime.trails.test.ts`). Scope by receiver, not by method name.

## Acceptance criteria

- [ ] `invertTransaction` mirrors `command_recorder.rb:186-194` whole: it runs
      the block through `subRecorder.revert(block)` itself and returns
      `["transaction", args, invertionsProc]`.
- [ ] The `transaction` forwarder carries no special-casing beyond what
      `command_recorder.rb:125-132` generates, and its explanatory comment goes
      with the special-casing.
- [ ] `record` and `inverseOf` keep their Rails names, parameter names, branch
      order and `IrreversibleMigration` message verbatim.
- [ ] The block's inverses still land before the `transaction` command, and
      `invertible-migration.test.ts` > `migrate revert transaction` and
      `command-recorder.test.ts` > `invert transaction with irreversible inside
is irreversible` both still pass.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
