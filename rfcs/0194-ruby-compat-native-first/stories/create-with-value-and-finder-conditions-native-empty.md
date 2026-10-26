---
title: "createWithValue and finder conditions empty? use native forms"
status: done
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9329
claim: "2026-10-26T14:48:26Z"
assignee: "create-with-value-and-finder-conditions-native-empty"
blocked-by: null
closed-reason: null
---

## Context

trails#9305 converted the `empty?` sites onto `.length` wherever the TS checker proves the receiver. Two sites kept ruby-compat `isEmpty` because their TS types prove nothing:

- `packages/activerecord/src/relation.ts` `scopeForCreate`: `!isEmpty(this.createWithValue)`. `createWithValue` is typed `unknown`. In Rails it is a Hash (`activerecord/lib/active_record/relation.rb`, `scope_for_create`: `create_with_value.empty?`; `query_methods.rb` defaults `create_with_value` to `FROZEN_EMPTY_HASH`).
- `packages/activerecord/src/relation/finder-methods.ts:475` `ordered_relation`/`exists?` path: `!isEmpty(conditions)`, where `conditions` is typed `AnyObject | any[] | Map<any, any>`.

## Acceptance criteria

- `createWithValue` is typed as a plain-object `Record<string, unknown>`, and the site reads `Object.keys(this.createWithValue).length > 0`, which the typed `length@typed` credit accepts.
- `conditions` is narrowed to the types Rails passes there, and the check uses a native form.
- `pnpm parity:api:calls` and `parity:api:calls:args` stay green with no new rows.
