---
title: "structure_load should pass the script via --execute ... SOURCE, not stdin"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6563
claim: "2026-08-15T13:15:05Z"
assignee: "wave-1b-relation-own-file-rows-remainder"
blocked-by: null
closed-reason: null
---

# `structure_load` should pass the script via `--execute ... SOURCE`, not stdin

## Context

Surfaced converging RFC 0099's `kind: "args"` rows in PR #6557. The row

    activerecord | tasks/mysql-database-tasks.ts | structure_load | run_cmd
    rubyArgs: ["mysql", args, "loading"]

carries a reviewed reason rather than a fix.

`vendor/rails/activerecord/lib/active_record/tasks/mysql_database_tasks.rb:59-66`:

    def structure_load(filename, extra_flags)
      args = prepare_command_options
      args.concat(["--execute", %{SET FOREIGN_KEY_CHECKS = 0; SOURCE #{filename}; SET FOREIGN_KEY_CHECKS = 1}])
      args.concat(["--database", db_config.database.to_s])
      args.unshift(*extra_flags) if extra_flags
      run_cmd("mysql", args, "loading")
    end

trails reads the file itself and feeds the script on stdin, so it calls
`runCmd("mysql", args, "loading", stdin)` with a fourth argument
(`packages/activerecord/src/tasks/mysql-database-tasks.ts:100-108`). It also
drops Rails' `--execute` element from `args` entirely.

`SOURCE` is a mysql-client builtin and is accepted inside `--execute`, so
Rails' shape should port directly; the stdin route was a convenience, not a
necessity. Converging also removes a `readFileSync` from this path.

## Converged shape

Build `args` exactly as mysql_database_tasks.rb:60-63 does and call
`runCmd("mysql", args, "loading")` with three arguments.

## Acceptance criteria

- [ ] `structureLoad` builds Rails' `--execute` argument and drops the stdin
      parameter at this call site.
- [ ] `runCmd`'s `stdin` parameter is removed if this was its only caller.
- [ ] Verified against a real MySQL/MariaDB lane, not just SQLite — this path is
      only exercised there.
- [ ] The `structure_load -> run_cmd` row is deleted by hand from its shard
      (no `--write`, no reseed).
