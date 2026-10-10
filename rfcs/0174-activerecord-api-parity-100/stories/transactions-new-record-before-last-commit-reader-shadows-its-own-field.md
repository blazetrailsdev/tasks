---
title: "activerecord: _new_record_before_last_commit is a method shadowed by its own field, truthy before the first write"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
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

Rails declares `attr_accessor :_new_record_before_last_commit`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/transactions.rb:16`): one ivar, read and
written by name (`transactions.rb:425,436,453,455`), and read off another record by
`Transaction#prepare_instances_to_run_callbacks_on`
(`activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:366`):

```ruby
record._new_record_before_last_commit = true if earlier_saved_candidate&._new_record_before_last_commit
```

trails ports the reader as a METHOD mixed onto `Base`
(`packages/activerecord/src/transactions.ts` `_newRecordBeforeLastCommit`, installed at
`base.ts:2828`) whose body reads a field of the same name:

```ts
export function _newRecordBeforeLastCommit(this: Base): boolean {
  return (this as any)._newRecordBeforeLastCommit ?? false;
}
```

and every writer assigns an own property over it through `(this as any)` (`base.ts:1804,1885`,
`transactions.ts`). So the name is a function until the first write and a boolean after it:

- Before any write, `record._newRecordBeforeLastCommit` is the prototype function, which is truthy.
  `prepareInstancesToRunCallbacksOn` (`connection-adapters/abstract/transaction.ts`) reads it as a
  property, as Rails reads the accessor, so an earlier candidate that never had the field written
  reads as "new before last commit".
- Called as a method before any write, the body reads the same prototype function and returns it.
- The member is not declared on `Base`'s type, which is why every site casts through `any` and why
  #8403's `TransactionRecord` contract had to type it `unknown`.

## Converged shape

One accessor property, per CLAUDE.md § "Generated attribute readers are properties": a field (or
get/set pair) named `_newRecordBeforeLastCommit`, declared on `Base`, initialised the way Rails'
ivar is (`nil`), read and written by name with no `any` cast and no method of the same name.

## Acceptance criteria

- [ ] `_newRecordBeforeLastCommit` is a declared property on `Base`; the mixed-in method is gone.
- [ ] A record that never had it written reads falsy, with a test that fails on the current code.
- [ ] The `(this as any)._newRecordBeforeLastCommit` casts in `base.ts` and `transactions.ts` are
      gone, and `TransactionRecord` in `abstract/transaction.ts` types it as Rails' value.
