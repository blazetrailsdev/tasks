---
title: "Generated recordable forwarders drop &block into args"
status: draft
updated: 2026-08-28
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

Rails generates every recordable command forwarder as

```ruby
# vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:125-132
ReversibleAndIrreversibleMethods.each do |method|
  class_eval <<-EOV, __FILE__, __LINE__ + 1
    def #{method}(*args, &block)          # def create_table(*args, &block)
      record(:"#{method}", args, &block)  #   record(:create_table, args, &block)
    end                                   # end
  EOV
  ruby2_keywords(method)
end
```

so the block reaches `record` as the tuple's THIRD element and never enters
`args`. trails' generation loop
(`packages/activerecord/src/migration/command-recorder.ts:848-861`) calls
`this.record(method, args)` with no block at all, so a block passed to a
generated method stays inside the `args` array and is recorded as an ordinary
positional argument.

Two consequences are already visible in the file:

- `invertCreateTable` has to hunt for the trailing options hash past a possible
  function (`command-recorder.ts:227`), because `createTable`'s block lands in
  `args` where Ruby has it in `&block`.
- The loop pops trailing `undefined`s off `args`
  (`command-recorder.ts:857-858`) — a trails-only guard with no Ruby
  counterpart, standing in for what `*args` gives Ruby for free.

`transaction` is the one forwarder that already extracts its block
(`command-recorder.ts:840-846`, made plain by PR #7175) because
`invertTransaction` needs it as `&block` (`command_recorder.rb:186-194`).

## Converged shape

Make the generated loop mirror `def m(*args, &block); record(:m, args, &block); end`:
pop a trailing function argument into `block` and pass it as `record`'s third
parameter for EVERY generated method, then delete `transaction`'s hand-written
forwarder so it is generated like the rest.

That moves the block out of `args` for `createTable`, `dropTable`,
`createJoinTable`, `changeTable` and every other block-taking recordable, so
the `invert_*` bodies can read the tuple the way Ruby does. Expect to adjust
`invertCreateTable`'s trailing-hash search (`:227`) and `invertDropTable`,
plus the `command-recorder.test.ts` / `invertible-migration.test.ts`
assertions that currently spell the block inside `args`
(e.g. `["createTable", ["apples", block], undefined]`).

Whether the trailing-`undefined` pop can also go depends on whether any caller
still materializes optional parameters; check it as part of the same change
rather than leaving it as unexplained extra logic.

## Acceptance criteria

- [ ] The generation loop passes the block as `record`'s third argument,
      mirroring `command_recorder.rb:125-132`.
- [ ] `transaction` has no hand-written forwarder — it is generated with the
      rest.
- [ ] Recorded tuples put a block in position 3, not inside `args`, and the
      `invert_*` bodies read it there.
- [ ] The trails-only trailing-`undefined` pop is removed, or its need is
      demonstrated at the call site.
- [ ] `command-recorder.test.ts`, `command-recorder.trails.test.ts` and
      `invertible-migration.test.ts` pass with no test-name changes.
