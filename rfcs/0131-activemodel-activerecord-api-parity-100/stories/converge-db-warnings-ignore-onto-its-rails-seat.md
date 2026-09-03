---
title: "Give db_warnings_ignore its Rails reader/writer pair and delete the ar-config.ts invention it currently lives on"
status: done
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 170
priority: 3
pr: 7428
claim: "2026-09-03T01:39:04Z"
assignee: "converge-db-warnings-ignore-onto-its-rails-seat"
blocked-by: null
closed-reason: null
---

## Context

`base.rb` sits at 550/552, missing `db_warnings_ignore` and its writer — and
neither is declaration-only, so nothing in `base.ts` declares them at all.

Rails puts the seat on the `ActiveRecord` module and flattens it onto `Base`:
`vendor/rails/activerecord/lib/active_record.rb:260-263` —
`singleton_class.attr_accessor :db_warnings_ignore` with
`self.db_warnings_ignore = []`. It is read by the adapter's warning filter.

trails has the value, on a trails-invented config object:
`packages/activerecord/src/ar-config.ts:174`, `dbWarningsIgnore: [] as (string
| RegExp)[]`, read at
`connection-adapters/abstract-adapter.ts:2112` and saved/restored in
`support/with-db-warnings-action.ts:16`.

So this is two defects in one: the reader/writer pair Rails exposes is missing,
and the seat it should live on is an invention. Per CLAUDE.md, a documented
deviation is debt rather than permission — the story converges the seat, it
does not add the pair alongside the invention.

## Acceptance criteria

- `dbWarningsIgnore` and its writer are a real accessor pair reachable where
  Rails puts them, and the `ar-config.ts` entry is deleted rather than kept in
  parallel.
- Both existing readers (`abstract-adapter.ts:2112`,
  `support/with-db-warnings-action.ts:16`) go through the new seat.
- activerecord `base.rb` reaches **552/552**; package total rises by 2.
- `pnpm parity:api:extra --package activerecord` does not rise, and the
  extra-surface mark moves only via `:tighten`.
- The db-warnings tests pass on every adapter lane.

## Definition of done

Adding the reader/writer pair while leaving the `ar-config.ts` entry in place does not close this story. A documented deviation is debt, not permission.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
pnpm parity:api:extra --package activerecord
pnpm parity:api:extra:gate
```

Deleting the `ar-config.ts` entry should lower `parity:api:extra`; tighten the
mark, never raise it.
