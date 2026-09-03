---
title: "Close the seven one-method misses across result, schema_dumper, future_result, scoping, read, belongs_to_association and reflection"
status: in-progress
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 280
priority: 4
pr: 7441
claim: "2026-09-03T12:20:52Z"
assignee: "port-instrumentation-process-action-raw-payload"
blocked-by: null
closed-reason: null
---

## Context

Six one-method files, each a placement or spelling miss rather than absent
behavior. Grouped because each is a few lines and six separate PRs would cost
six CI runs for a diff well inside the ceiling.

| Ruby                                                                     | Rails                                                                                                | trails state                                                                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `result.rb` `key?` → `isKey`                                             | `vendor/rails/activerecord/lib/active_record/result.rb:66`                                           | not declaration-only — the predicate is spelled something other than what `docs/ruby-ts-conventions.md` produces |
| `schema_dumper.rb` `indexes`                                             | `vendor/rails/activerecord/lib/active_record/schema_dumper.rb:232`, `def indexes(table, stream)`     | declaration-only; `indexes_in_create` (`:244`) already matches, so the body is one file off                      |
| `future_result.rb` `instrument`                                          | `vendor/rails/activerecord/lib/active_record/future_result.rb:33`                                    | absent                                                                                                           |
| `scoping.rb` `initialize` → `constructor`                                | `ScopeRegistry#initialize`, `vendor/rails/activerecord/lib/active_record/scoping.rb:86`              | the registry's two other members already credit as moves to `base.ts`, so the class is misplaced                 |
| `attribute_methods/read.rb` `attribute`                                  | `read.rb:11` `define_method_attribute` generates it                                                  | declaration-only — CLAUDE.md's "Generated attribute readers are properties" section governs the shape            |
| `associations/belongs_to_association.rb` + `reflection.rb` `primary_key` | `belongs_to_association.rb:151` and `reflection.rb:356`, both `def primary_key(klass)`, both private | absent under that arity                                                                                          |

Both `primary_key` arms take `klass` and are private; they are listed together
because they are the same one-line body in two files.

Each row is independent; the story is one PR only because the pieces are
individually trivial. If any one turns out to need real design, file it
separately rather than growing this PR.

## Acceptance criteria

- `result.rb` reaches **24/24**, `schema_dumper.rb` **36/36**,
  `future_result.rb` **16/16**, `scoping.rb` **19/19**,
  `attribute_methods/read.rb` **4/4**,
  `associations/belongs_to_association.rb` **21/21** and `reflection.rb`
  **117/117**.
- activerecord package total rises by 7.
- Every member private in Rails carries `@internal`, and `pnpm lint` is clean
  without `--fix` supplying it.
- No member is satisfied by a bodyless declaration; each name is a real body in
  the file that mirrors its `.rb`.
- `pnpm parity:api:calls`, `:calls:args` and `:params` clean.

## Definition of done

A bodyless declaration in the mirroring file does not close any row here. If one of the seven turns out to need real design, drop it and file it — a partly-converged PR that claims all seven does not close this story either.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
pnpm lint
```

Read all seven file rows. If any one turns out to need real design, drop it
from the PR and file it rather than growing the diff.
