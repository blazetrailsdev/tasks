---
title: "tasks list --json truncates at a 64KiB pipe boundary, breaking every jq consumer"
status: draft
updated: 2026-10-10
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm tasks list --json` **silently truncates at a 64KiB pipe-buffer boundary**,
so every consumer that pipes it into `jq` or a JSON parser gets a parse error on
a partial document — while the exit status is 0.

Measured in a worktree on 2026-10-09:

```console
pnpm tasks list --json | wc -c      ->  65536   (also seen: 81920)
pnpm tasks list --json > file       ->  10502968, parses as valid JSON
```

The cut lands on a multiple of 64KiB and varies between runs, which is the
signature of a process exiting before an **async** stdout write has drained.
Node writes to a pipe asynchronously and to a file synchronously, which is
exactly why the redirect is whole and the pipe is not. The likely site is a
`process.exit()` reached while the serialized payload is still buffered; the
payload is ~10MB, so it can never fit the pipe buffer in one go.

This is the same class of defect as this RFC's
`commitandpush-mutator-exit-leaks-lock`: work ordered after an `exit` that never
runs.

**Impact is on every review.** The documented way a reviewer resolves a story is
to pipe `tasks list --json` into `jq`. On trails#8738 the fidelity reviewer
failed to resolve the story on **four consecutive passes**, each time reporting
"`pnpm tasks list --json` emitted non-JSON on stdout, jq parse error", and
reviewed against the PR description alone instead. The diagnosis in those
reports — non-JSON prose on stdout — is wrong, which is itself a reason to fix
this at the source: the failure mode misleads whoever hits it.

Not a Rails deviation: the tasks CLI has no Rails counterpart, so there is no
`file.rb:LINE` to converge toward. This is a plain correctness bug.

## Acceptance criteria

- `pnpm tasks list --json | cat` emits the complete document; piping it into a
  JSON parser succeeds.
- Holds for the large payload (~10MB today), not just a filtered subset.
- `tasks list --json` exits non-zero if the payload cannot be written in full,
  rather than exiting 0 on a partial write.
- A regression test pipes the command's stdout through a parser and asserts the
  document is complete — a test that writes to a file would pass against the
  current bug and must not be the only coverage.
- Audit the other `--json` read verbs (`show`, `ready`, `next-bundle`) for the
  same exit-before-drain path and fix them together if they share it.

## Notes

The fix is in the tasks repo (`src/cli.ts` and whatever it calls to serialize),
not in trails. Prefer letting the process end naturally, or awaiting a drain /
`stream.write` callback before exiting, over raising the buffer size.
