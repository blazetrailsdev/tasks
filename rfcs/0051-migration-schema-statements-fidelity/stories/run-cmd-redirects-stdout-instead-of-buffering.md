---
title: "run-cmd-redirects-stdout-instead-of-buffering"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6233
claim: "2026-08-08T13:15:56Z"
assignee: "run-cmd-redirects-stdout-instead-of-buffering"
blocked-by: null
closed-reason: null
---

## Context

`runCmd` (`packages/activerecord/src/tasks/sqlite-database-tasks.ts`) diverges
from Rails' helper in the mechanism it uses to write the child process's output.

Rails redirects the child's stdout to the output file at the OS level, so the
bytes sqlite3 writes land in the file untouched:

    # vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:72-74
    def run_cmd(cmd, args, out)
      fail run_cmd_error(cmd, args) unless Kernel.system(cmd, *args, out: out)
    end

trails captures stdout as a decoded UTF-8 string and then writes it:

    const result = childProcess.spawnSync(cmd, args, { encoding: "utf8" });
    ...
    getFs().writeFileSync(out, result.stdout ?? "");

Two observable differences follow. The output is decoded and re-encoded, so a
dump containing bytes that are not valid UTF-8 (a non-UTF-8 table or column
identifier, a `DEFAULT` string literal in another encoding) round-trips through
U+FFFD rather than surviving verbatim — which defeats the "byte-comparable with
Rails'" goal. And the whole dump is buffered in memory rather than streamed,
so a large schema is bounded by `maxBuffer` where Rails' is not.

`SpawnSyncOptions` (`packages/activesupport/src/child-process-adapter.ts:11-21`)
exposes only `input` / `env` / `encoding` / `cwd` — there is no stdio/fd
redirect on the adapter surface, so converging `runCmd` means widening that
interface first (e.g. an `out`/`stdio` option the node adapter maps onto
`child_process.spawnSync`'s `stdio: ["ignore", fd, "pipe"]`), then having
`runCmd` pass the file through instead of buffering.

Surfaced in review of PR #6231, which converged SQLite `structure_dump` /
`structure_load` onto the CLI and so made `runCmd` live in production for the
first time — it was ported but uncalled before that. The same `runCmd` shape is
used by the PG and MySQL task files, so this is a one-place fix with three
beneficiaries.

## Acceptance criteria

- [ ] `SpawnSyncOptions` carries an output-redirect option and the node
      child-process adapter maps it onto `spawnSync`'s `stdio`.
- [ ] `runCmd` redirects the child's stdout to `out` rather than capturing and
      re-writing it, matching `Kernel.system(cmd, *args, out: out)`.
- [ ] A dump containing a non-UTF-8 byte survives `structure_dump` verbatim
      (regression test fails on baseline).
- [ ] `runCmd`'s existing error path (`failed to execute:` plus exit
      status/signal/stderr details) is unchanged — stderr is still captured.
- [ ] Green on sqlite (file lane) and `sqlite3_mem`.
