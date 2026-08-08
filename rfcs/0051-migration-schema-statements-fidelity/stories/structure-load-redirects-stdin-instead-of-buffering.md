---
title: "structureLoad buffers the dump into a string where Rails redirects it into stdin"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6249
claim: "2026-08-08T17:27:58Z"
assignee: "collaborator-queries-use-select-values-insert-delete"
blocked-by: null
closed-reason: null
---

## Context

`SQLiteDatabaseTasks#structureLoad`
(`packages/activerecord/src/tasks/sqlite-database-tasks.ts`) reaches
`spawnSync` directly instead of going through the file's own `runCmd` helper:

    const childProcess = await getChildProcessAsync();
    const args = [...flags, this.dbConfig.database as string];
    childProcess.spawnSync("sqlite3", args, {
      encoding: "utf8",
      input: getFs().readFileSync(filename, "utf8"),
    });

Rails redirects the dump file into sqlite3's stdin from the shell
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:60-66`):

    def structure_load(filename, extra_flags)
      flags = extra_flags.join(" ") if extra_flags
      `sqlite3 #{flags} #{db_config.database} < "#{filename}"`
    end

The child-process adapter has no shell, so PR #6231 substituted `spawnSync`'s
`input` for the `<` redirect. That reads the whole dump into a JS string and
re-encodes it on the way to the child, so a dump containing bytes that are not
valid UTF-8 does not survive verbatim — the same class of defect that
`run-cmd-redirects-stdout-instead-of-buffering` fixed on the output side.

That story shipped as PR #6233, which widened `SpawnSyncOptions`
(`packages/activesupport/src/child-process-adapter.ts`) with an `out` option
mapped onto `spawnSync`'s `stdio`, and converged `runCmd` onto
`Kernel.system(cmd, *args, out: out)`. It established both the mechanism and
the precedent; the stdin side was simply not in its scope.

## Converged shape

Widen `SpawnSyncOptions` with an input-redirect option — the mirror of the
`out` option #6233 added — that the node adapter maps onto `spawnSync`'s
`stdio` (`stdio: [fd, "pipe", "pipe"]` over an fd opened on `filename`), and
have `structureLoad` pass the file through rather than buffering its bytes.

Note Rails' `structure_load` uses backticks, not `Kernel.system`, so it does
NOT check the child's exit status — the current trails code correctly ignores
the result too. Keep that: this story is about the redirect, not about adding
error handling Rails does not have.

## Acceptance criteria

- [ ] `SpawnSyncOptions` carries an input-redirect option and the node
      child-process adapter maps it onto `spawnSync`'s `stdio`.
- [ ] `structureLoad` redirects `filename` into the child's stdin rather than
      reading it into a string.
- [ ] A dump containing a non-UTF-8 byte survives `structureLoad` verbatim
      (regression test fails on baseline).
- [ ] `structureLoad` still ignores the child's exit status, matching Rails'
      backtick form at `sqlite_database_tasks.rb:60-66`.
- [ ] Green on sqlite (file lane) and `sqlite3_mem`.
