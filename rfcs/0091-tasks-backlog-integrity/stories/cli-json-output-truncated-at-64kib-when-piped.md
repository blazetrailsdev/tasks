---
title: "tasks CLI truncates stdout at 64 KiB when piped (process.exit before flush)"
status: draft
updated: 2026-09-24
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: ["tasks"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`tasks list --json` loses its output past 64 KiB when stdout is a pipe. It
was found while verifying tasks#172. At the time,
`tasks list --rfc 0158-activesupport-assertion-surfaced-port-bugs --json`
wrote 68536 bytes when redirected to a file, but exactly 65536 bytes through
`| wc -c`. `| python3 -c 'json.load(sys.stdin)'` then failed with
`Expecting property name … (char 65535)`.

Cause: `src/cli.ts:469` ends the process with `process.exit(process.exitCode ?? 0)`.
Node writes to a pipe asynchronously, so `process.exit()` drops whatever is
still queued beyond the pipe buffer, which is 64 KiB on Linux. A write to a
file or a TTY is synchronous, which is why a redirect to a file hides the
bug. Every verb that prints a lot is affected: `list --json`, `ready --json`,
`next-bundle --json` and `show`. It hits hardest in agent pipelines that
parse `--json` through `| jq` or `| python3`.

## Acceptance criteria

- The CLI finishes writing stdout before it exits. For example, set
  `process.exitCode`, close the DB connection, and let the event loop drain.
  Or await `process.stdout.write("", resolve)` before `process.exit`.
- A regression test pipes a `--json` listing of more than 64 KiB through a
  child process and parses it in full.
