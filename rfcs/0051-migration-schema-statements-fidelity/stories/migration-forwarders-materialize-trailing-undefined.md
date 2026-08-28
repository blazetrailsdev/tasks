---
title: "Migration's forwarders materialize a trailing undefined where Ruby passes nothing"
status: done
updated: 2026-08-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 7181
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Migration#createTable` (`packages/activerecord/src/migration.ts:535-555`)
takes `(name, optionsOrFn, fn)` and forwards all three positionally:

```ts
await this.connection.createTable(tname, optionsOrFn, fn);
```

Rails' signature is `create_table(table_name, **options, &block)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:307`),
forwarded through `Migration#method_missing` as `*arguments, &block`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1043-1052`) — an
absent options hash or block passes NOTHING, so `*args` inside
`CommandRecorder`'s generated forwarder
(`vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:125-132`)
never sees a placeholder.

The TS forwarders materialize a trailing `undefined` instead, which is why the
generated forwarder still carries a trails-only guard
(`packages/activerecord/src/migration/command-recorder.ts:844-852`, PR #7177):

```ts
while (args.length > 0 && args[args.length - 1] === undefined) args.pop();
```

PR #7177 moved the block into the tuple's third seat, matching Ruby, but could
not delete this pop: removing it reds 8 tests in `migration.test.ts` /
`invertible-migration.test.ts`, because a block-only `createTable("widgets", fn)`
reaches the recorder as `["widgets", fn, undefined]` and the block is no longer
the last argument.

## Converged shape

Make `Migration`'s block-taking forwarders pass Ruby's argument list — options
only when given, block only when given — rather than every declared parameter.
The block-taking recordables are `createTable` (`migration.ts:535`),
`dropTable` (`migration.ts:567`), `createJoinTable` and `changeTable`; the
non-block recordables should likewise not forward an absent trailing options
hash as `undefined`.

Once no caller materializes a trailing `undefined`, delete the pop in
`command-recorder.ts` so the generated forwarder is exactly
`record(method, args, block)`.

## Acceptance criteria

- [ ] No `Migration` forwarder passes a trailing `undefined` for an argument
      the caller did not supply.
- [ ] The trailing-`undefined` pop is deleted from the generated-forwarder loop
      in `command-recorder.ts`.
- [ ] `migration.test.ts`, `invertible-migration.test.ts`,
      `command-recorder.test.ts` and `command-recorder.trails.test.ts` pass
      with no test-name changes.
