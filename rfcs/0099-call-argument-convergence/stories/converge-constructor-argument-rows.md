---
title: "Converge the 36 constructor-argument rows (-> new), the largest surviving args cluster"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6557
claim: "2026-08-15T00:39:10Z"
assignee: "converge-ar-and-model-non-constructor-argument-rows"
blocked-by: null
closed-reason: null
---

# Converge the 36 constructor-argument rows (`-> new`), the largest surviving args cluster

## Context

Measured 2026-08-14 over `scripts/api-compare/call-mismatches-exclude/**`
(`kind: "args"`, restricted to this RFC's `packages:` list). **RFC 0099 is at 89
rows remaining against the 490 it was chartered on** — an 82% burndown across
104 done stories. This story and its two siblings account for all 89, so
landing the three puts the RFC in reach of its exit.

**36 of the 89 are one mechanism: a call to `new` whose argument list does not
match Rails'.** That is the single largest surviving cluster and it cuts across
all six packages, which is why it is worth taking as a mechanism rather than
per-file.

| File                                                              | Rows                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activemodel/attribute-methods.ts`                                | 3 — `attribute_method_patterns_cache`, `attribute_method_prefix`, `attribute_method_suffix`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `activerecord/encryption/cipher/aes256-gcm.ts`                    | 3 — `decrypt`, `encrypt` ×2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `activemodel/secure-password.ts`                                  | 2 — `has_secure_password` ×2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `activerecord/associations/alias-tracker.ts`                      | 2 — `create` ×2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `activerecord/connection-adapters/abstract/connection-handler.ts` | 2 — `initialize`, `resolve_pool_config`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `activerecord/migration/command-recorder.ts`                      | 2 — `change_table`, `invert_transaction`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 22 further files                                                  | 1 each — `activemodel/{attribute-registration,attribute-set/builder,model,serializers/json,type/string}`, `activerecord/{connection-adapters/abstract/connection-pool,connection-adapters/mysql2/database-statements,connection-adapters/sqlite3-adapter,encryption/config,reflection,relation,relation/calculations,relation/query-methods,tasks/database-tasks}`, `activesupport/{callbacks,core-ext/string/output-safety,encrypted-file,hash-with-indifferent-access}`, `arel/{nodes/binary,select-manager,visitors/visitor}`, `i18n/config` |

A representative row, to show what the gate is actually comparing:

```json
{
  "package": "activemodel",
  "tsFile": "attribute-methods.ts",
  "rubyName": "attribute_method_patterns_cache",
  "call": "new",
  "rubyArgs": ["kwargs{initialCapacity=num:4}"],
  "kind": "args"
}
```

Every row still carries the seeded RFC 0095 reason ("pending per-body
convergence review"), so none of these has been reviewed — the cluster is
unexamined debt, not ratified deviation.

Expect a mix of outcomes and do not assume the whole cluster converges: some
rows are a genuine dropped argument (a capacity hint, a `strict:` kwarg, a
positional Rails threads through), and some will be a JS constructor that
legitimately cannot take Ruby's argument (a `Hash.new(0)` default-proc has no
`Map` analogue). Converge what converges; each row you cannot, costs a
**reviewed one-line reason replacing the seed** — never a new row, never a
broadened one.

## Acceptance criteria

- [ ] Every one of the 36 `-> new` rows is either deleted (the TS call now
      passes what Rails passes) or carries a reviewed, row-specific reason that
      replaces the RFC 0095 seed string.
- [ ] `pnpm parity:api:calls:args` is green; the AR-closure `kind: "args"` row
      count drops from 89 by the number converged, and does not rise.
- [ ] Converged rows are deleted **by hand** from their shard, and any resulting
      stale high-water mark is fixed with
      `pnpm parity:api:calls:tighten <shard>` — no `--write`, no reseed.
- [ ] Constructors changed to accept a Rails argument keep the Rails parameter
      name and order (`docs/ruby-ts-conventions.md`), and add no new public
      surface (`pnpm parity:api:extra`).
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.

## Notes

36 rows across 28 files is more than one PR at the LOC ceiling. Split by
package — `activemodel` + `arel` + `i18n` first (11 rows, smallest blast
radius), then `activerecord` (16), then `activesupport` (4) plus the
adapter/connection rows — and file each split as its own story.
