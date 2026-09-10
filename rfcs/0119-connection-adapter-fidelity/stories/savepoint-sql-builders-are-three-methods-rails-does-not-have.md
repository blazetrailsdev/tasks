---
title: "The three savepoint *Sql builders are extra surface; savepoints.rb interpolates inline"
status: done
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 10
pr: trails#7653
claim: "2026-09-09T19:56:14Z"
assignee: "savepoint-sql-builders-are-three-methods-rails-does-not-have"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7644, which closed `savepoint-name-validator-is-a-guard-rails-does-not-have`
by deleting `validateSavepointName`. That story's AC named "the three `*Sql`
builders" as the thing to fix, so the builders themselves survived — but they
are a trails invention, and with the validator gone they carry nothing.

`packages/activerecord/src/connection-adapters/abstract/savepoints.ts` exports
three functions Rails has no counterpart for:

```ts
export function createSavepointSql(name: string | null): string {
  return `SAVEPOINT ${name ?? ""}`;
}
export function execRollbackToSavepointSql(name: string | null): string { ... }
export function releaseSavepointSql(name: string | null): string { ... }
```

Rails interpolates inline, in the three methods themselves
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/savepoints.rb:11-21`):

```ruby
def create_savepoint(name = current_savepoint_name)
  internal_execute("SAVEPOINT #{name}", "TRANSACTION")
end

def exec_rollback_to_savepoint(name = current_savepoint_name)
  internal_execute("ROLLBACK TO SAVEPOINT #{name}", "TRANSACTION")
end

def release_savepoint(name = current_savepoint_name)
  internal_execute("RELEASE SAVEPOINT #{name}", "TRANSACTION")
end
```

One Rails method is one TS method; these are three extra ones. `parity:api:extra
--package activerecord` scores `connection-adapters/abstract/savepoints.ts` at
**3 novel, 0 moved** — it is rank 20 in the per-file table, and all three novel
names are these builders. Their only callers outside the file are the three
`*Sql` assertions in `abstract/savepoints.trails.test.ts`, so nothing depends on
them being separately callable.

## Converged shape

Delete the three builders and interpolate at the three call sites, so each of
`createSavepoint` / `execRollbackToSavepoint` / `releaseSavepoint` is one method
whose body is `savepoints.rb`'s one line:

```ts
await this.internalExecute(`SAVEPOINT ${spName ?? ""}`, "TRANSACTION");
```

Note `?? ""` is load-bearing and must survive the inlining: Ruby renders a nil
name as the empty string (`ruby -e 'puts "SAVEPOINT #{nil}".inspect'` => `"SAVEPOINT "`),
where JS renders `${null}` as the literal `"null"`. #7644 fixed that and pinned
it in `savepoints.trails.test.ts` ("interpolates a null name the way Ruby
interpolates nil"); rewrite that test against the three adapter methods rather
than deleting the coverage.

`parity:api:extra:gate` is only-shrink, so narrow the activerecord mark with
`pnpm parity:api:extra:tighten` once the three names are gone.

## Acceptance criteria

- [ ] `createSavepointSql`, `execRollbackToSavepointSql` and
      `releaseSavepointSql` are gone; the three adapter methods interpolate
      inline, matching `savepoints.rb:11-21` line for line.
- [ ] The nil-name behaviour is still pinned by a test that fails if the
      interpolation renders `null`.
- [ ] `pnpm parity:api:extra --package activerecord` scores
      `connection-adapters/abstract/savepoints.ts` at 0 novel, and the
      activerecord novel mark is tightened.
- [ ] SQLite, PostgreSQL and MariaDB lanes green.
