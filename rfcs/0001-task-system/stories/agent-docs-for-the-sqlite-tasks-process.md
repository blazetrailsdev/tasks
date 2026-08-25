---
title: "Update agent-facing docs and skills for the SQLite tasks process"
status: done
updated: 2026-08-25
rfc: "0001-task-system"
cluster: null
packages: ["railties"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7100
claim: "2026-08-25T22:39:34Z"
assignee: "docs-agent"
blocked-by: null
closed-reason: null
---

## Context

The tasks repo moved from git-as-database to SQLite (see `README.md`). Story
**state** now lives in a database; story **prose and structure** still live in
markdown and still change by PR. Agent-facing docs and skills were written for
the old model and now describe a workflow that will silently not work.

The dangerous case is not an agent that gets an error. It is an agent that
hand-edits `status: done` in a story file, opens a PR, gets it merged, and
believes the story is finished. Ingest deliberately ignores DB-owned fields, so
that edit changes nothing. CI rejects such a PR today, but nothing yet *tells*
an agent the rule before it writes the file.

Everything an agent reads about tasks needs to state the ownership split and
name the verb to use instead.

## The rule to document

Frontmatter fields have exactly one authority each, and the two sets are
disjoint — which is why ingest and export cannot conflict.

| Owner        | Fields                                                                                       | Changed by                    |
| ------------ | -------------------------------------------------------------------------------------------- | ----------------------------- |
| **Markdown** | `title`, `rfc`, `cluster`, `deps`, `deps-rfc`, `est-loc`, `priority`, `packages`, body prose | edit the file, open a PR      |
| **Database** | `status`, `pr`, `claim`, `assignee`, `blocked-by`, `closed-reason`, `updated`                | a `tasks` verb — never by hand |

Rules of thumb worth stating explicitly in each doc:

- **Rewriting what the work IS** — retitling, resizing `est-loc`, adding a
  dependency, rewriting acceptance criteria — is a markdown edit. Edit the file,
  commit, open a PR. Ingest picks it up when the PR merges.
- **Recording what HAPPENED to the work** — claimed, in progress, done, blocked,
  closed — is a verb. `tasks claim`, `tasks in-progress --pr N`, `tasks done
  --pr N`, `tasks block`, `tasks close`. Never edit those fields by hand.
- **Creating a story** is authoring, so it is markdown: `tasks new <rfc> <slug>`
  writes the file, commits it, and runs ingest to create the row. Do not insert
  rows any other way.
- `status` in a *new* file is honored as a birth seed on insert only, and
  ignored on every later ingest. "Seed value, not a sync value."

## Acceptance criteria

- [ ] `trails/CLAUDE.md` (and the tasks repo's own `CLAUDE.md`, if it gains one)
      state the ownership table and the two rules of thumb.
- [ ] The agent skills that mention tasks are updated: `skills-archive/tasks-loop`,
      `skills-archive/spawn-loop`, `skills-link`, `skills-ci-resolve`, and any
      worker/reviewer prompt that tells an agent how to mark work done.
- [ ] Any reference to `pnpm tasks` reaching for `scripts/cli.ts` is corrected —
      the entry point is `src/cli.ts` now (btwhooks probes both; docs should name
      the current one).
- [ ] Worker prompts say `tasks done <id> --pr N`, and say plainly that editing
      `status:`/`pr:` in the file does nothing and will fail CI.
- [ ] A short "why" sentence accompanies the rule, not just the rule — an agent
      that understands the split will generalize to fields this list forgets.
- [ ] `git grep -n "scripts/cli.ts"` in trails and btwhooks returns only
      historical references (changelogs, this story), not instructions.

## Definition of done

Not done if it only lists the DB-owned fields. The docs must also say what to do
instead for each one, because an agent blocked by CI needs the replacement verb
in the same paragraph, not a cross-reference.

Not done if `tasks-legacy` is described as current anywhere an agent reads.

## Verification

```bash
# No doc still instructs an agent toward the old entry point.
git -C ~/github/blazetrailsdev/trails grep -n "scripts/cli.ts" -- '*.md' || echo clean

# The ownership rule is actually present where agents read it.
git -C ~/github/blazetrailsdev/trails grep -ln "blocked-by\|closed-reason" -- CLAUDE.md

# And the guard still bites, so the docs match enforcement:
#   edit status: by hand in any story, commit, then
tsx scripts/check-owned-fields.ts   # expect exit 1 naming the verb
```
