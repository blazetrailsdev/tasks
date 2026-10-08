---
title: 'tasks: `new` can print git''s "Cannot fast-forward… run git reset --hard" while succeeding'
status: draft
updated: 2026-10-08
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Seen on 2026-10-08 filing `backlog-row-prints-a-zero-est-loc-ringo-omits`. `pnpm tasks new` succeeded
— the story was created, committed and pushed — but printed this in the middle of its output:

```text
fatal: Cannot fast-forward your working tree.
After making sure that you saved anything precious from
$ git diff 8ac7c95dcfa4191c2abc87fc52b38d855143457a
output, run
$ git reset --hard
to recover.

  ingest: 1 created, 0 updated
```

Afterwards the checkout was clean and `HEAD` equalled `origin/main`, with the new story file present,
so nothing was wrong. But the message tells the reader to run `git reset --hard` in a checkout that
every agent on the box shares, and an agent that follows it could destroy another session's
uncommitted story edits.

Not reproduced on demand. It looks like a sync step fast-forwarding a working tree that another
writer had just advanced.

## Acceptance criteria

- Find which git command in the `new` path prints it and under what interleaving.
- Either the step cannot fail that way, or its failure is caught and reported in the CLI's own words,
  without git's `reset --hard` advice, and with a non-zero exit if the story was not actually
  written.
