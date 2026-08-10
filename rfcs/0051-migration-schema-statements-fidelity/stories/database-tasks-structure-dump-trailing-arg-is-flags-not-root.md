---
title: "DatabaseTasks.structureDump/Load take extraFlags where Rails takes root"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6258
claim: "2026-08-08T18:44:42Z"
assignee: "mysql-half-of-connection-handler-is-connected-flake"
blocked-by: null
closed-reason: null
---

## Context

Rails' facade takes the _root_ as its trailing argument and sources flags only
from configuration
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:362-374`):

```ruby
def structure_dump(configuration, *arguments)
  db_config = resolve_configuration(configuration)
  filename = arguments.delete_at(0)
  flags = structure_dump_flags_for(db_config.adapter)
  database_adapter_for(db_config, *arguments).structure_dump(filename, flags)
end

def structure_load(configuration, *arguments)
  db_config = resolve_configuration(configuration)
  filename = arguments.delete_at(0)
  flags = structure_load_flags_for(db_config.adapter)
  database_adapter_for(db_config, *arguments).structure_load(filename, flags)
end
```

So after `filename` is shifted off, what remains in `*arguments` is the `root`,
forwarded to the _task constructor_ via `database_adapter_for` — which is how
`sqlite_rake_test.rb:182` passes `"/rails/root"`:
`DatabaseTasks.structure_dump @configuration, filename, "/rails/root"`.

trails declares the third parameter as `extraFlags` instead
(`packages/activerecord/src/tasks/database-tasks.ts:817-829`, `:831-843`):

```ts
static async structureDump(
  configuration: DatabaseConfig | string | Record<string, unknown>,
  filename: string,
  extraFlags?: string | string[] | null,
): Promise<void> {
  const config = this.resolveConfiguration(configuration);
  const flags = extraFlags ?? this.structureDumpFlagsFor(config.adapter);
  ...
}
```

Two divergences fall out:

1. **The `root` is unreachable through the facade.** trails' task classes take
   `root` as their second constructor arg and default it to
   `DatabaseTasks.root`, but the facade never forwards one, so a caller cannot
   do what `sqlite_rake_test.rb:182` does.
2. **Flags become caller-overridable.** Rails always computes them from
   `structure_dump_flags_for(db_config.adapter)`; trails lets an argument
   pre-empt that. A caller passing flags silently bypasses the per-adapter Hash
   form (`structure_dump_flags[adapter.to_sym]`, `database_tasks.rb:619-625`).

Surfaced in PR #6248 while porting `SqliteStructureDumpTest`. The ported tests
now go through the facade and set `DatabaseTasks.structureDumpFlags` (mirroring
`with_structure_dump_flags`, `sqlite_rake_test.rb:234-240`) rather than passing
flags positionally, so they do not depend on the divergent parameter — but they
also cannot pass the `"/rails/root"` that Rails passes.

## Converged shape

Make the trailing parameter `root`, forwarded to the task constructor as
`database_adapter_for(db_config, *arguments)` does, and compute flags only from
`structureDumpFlagsFor` / `structureLoadFlagsFor`. Check the call sites first —
`DatabaseTasks.dumpSchema` (`database-tasks.ts:960`) calls
`this.structureDump(config, filename)` with no third argument and is unaffected,
but any caller passing flags positionally has to move to the class-level
setting.

Note `databaseAdapterFor` in trails is a registry of handler _singletons_
(`registerTask`), not task classes, so forwarding a per-call `root` may need
that registry shape addressed first — see
`0023-surfaced-deviations/database-tasks-registry-holds-singletons-not-task-classes`,
which this story likely depends on.

## Acceptance criteria

- [ ] `DatabaseTasks.structureDump` / `structureLoad` take the root as their
      trailing argument and forward it to the task, matching
      `database_tasks.rb:362-374`.
- [ ] Flags come only from `structureDumpFlagsFor` / `structureLoadFlagsFor`;
      no caller-supplied override path remains.
- [ ] The four ported tests in
      `packages/activerecord/src/adapters/sqlite3/sqlite-rake.test.ts` pass the
      `"/rails/root"` third argument as `sqlite_rake_test.rb:182,197,223,257` do.
- [ ] `pnpm parity:api` arity/parameter deltas non-negative.
