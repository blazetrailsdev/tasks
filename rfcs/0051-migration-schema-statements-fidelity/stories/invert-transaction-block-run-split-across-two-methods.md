---
title: "invert_transaction's block run lives in the transaction forwarder, splitting one Rails method in two"
status: ready
updated: 2026-08-27
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
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

trails splits that in half. `invertTransaction`
(`packages/activerecord/src/migration/command-recorder.ts:528-547`) builds the
sub-recorder and the proc but never runs the block; the run lives in the
generated `transaction` forwarder
(`command-recorder.ts:800-819`), which awaits the block and only then calls
`record("transaction", args)`.

The reason is an await point. Ruby's block is synchronous, so `inverse_of`
(`command_recorder.rb:114-123`) can run it inline; a TS block returns a promise,
and the run must COMPLETE before the `transaction` tuple is appended — the
block's statements record their inverses onto the outer recorder and have to
land first (Ruby's ordering, `command_recorder.rb:187`). `record` / `inverseOf`
are sync in trails as they are in Ruby, so the only place with an await is the
forwarder.

Both halves are documented at their call sites, and the observable behaviour
matches Rails. What does not match is the decomposition: one Rails method is
split across two TS ones, and the forwarder carries logic
`command_recorder.rb:125-132` does not have.

## Converged shape

Make `record` and `inverseOf` async so `invertTransaction` can `await
subRecorder.revert(block)` inline, restoring the one-Rails-method-one-TS-method
shape, and reduce the `transaction` forwarder to the plain generated
`record("transaction", args, block)` every other recordable method uses.

The cost, and the reason it was deferred out of PR #7092: an async `inverseOf`
reds every synchronous `expect(recorder.inverseOf(...)).toEqual(...)` in
`command-recorder.test.ts`, and an async `record` propagates through every
generated forwarder. Weigh that against the split before starting — if the
async chain is judged a worse deviation than the split (Ruby's `inverse_of` and
`record` are both sync), block this story with that finding rather than
converging halfway.

## Acceptance criteria

- [ ] `invertTransaction` mirrors `command_recorder.rb:186-194` whole: it runs
      the block through `subRecorder.revert(block)` itself and returns
      `["transaction", args, invertionsProc]`.
- [ ] The `transaction` forwarder carries no special-casing beyond what
      `command_recorder.rb:125-132` generates.
- [ ] The block's inverses still land before the `transaction` command, and
      `invertible-migration.test.ts` > `migrate revert transaction` and
      `command-recorder.test.ts` > `invert transaction with irreversible inside
is irreversible` both still pass.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
