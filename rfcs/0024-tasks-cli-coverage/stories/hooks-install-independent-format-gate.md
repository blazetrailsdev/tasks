---
title: "Make git hooks install-independent so the format gate fires in every worktree"
status: claimed
updated: 2026-06-15
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-15T19:48:08Z"
assignee: "hooks-install-independent-format-gate"
blocked-by: null
---

## Context

Markdown formatting/lint failures keep landing on `main` and reddening CI
(`prettier --check .` and markdownlint `MD040`), each from a different story
file committed unformatted (e.g. `remove-dead-buildcountsubquery.md`, its
stale `0023/README.md` table, `relation-handler-distinct-pk-materialization.md`
— three in one afternoon). The pre-commit hook is supposed to prevent this: it
runs `prettier --write` + `markdownlint-cli2 || exit 1` on staged markdown and
regenerates the stories tables. But it is being **silently bypassed**.

Root cause: `core.hooksPath` is set to `.husky/_`, husky v9's _generated_
wrapper directory. `.husky/_/` is neither tracked nor gitignored — it is
untracked output of husky's `prepare` step. `git worktree add` does not copy
untracked files, so a worktree created any way other than running
`pnpm install` (which `start-worktree.sh` does) has **no `.husky/_/`**. Git
then resolves `core.hooksPath=.husky/_` to a missing directory and runs **no
hook at all** — a silent skip, not a crash. Unformatted markdown sails through
and CI (which runs post-merge on push, so it detects rather than gates) goes
red for everyone.

The committed hook scripts themselves (`.husky/pre-commit`, `post-commit`,
`pre-push`) ARE tracked and exist in every worktree immediately. Only the
`.husky/_` indirection is missing. So the fix is to make hooks fire without
depending on `pnpm install` / husky's generated wrapper.

## Acceptance criteria

- [ ] Point `core.hooksPath` at the tracked `.husky` directory (or an
      equivalent committed hooks dir) so the hooks resolve in every worktree
      the instant it is created, with no `pnpm install` / husky `prepare`
      required. A freshly `git worktree add`-ed checkout (no `node_modules`,
      no `.husky/_`) must run pre-commit.
- [ ] Reconcile husky's `prepare` script so a subsequent `pnpm install` does
      not revert `core.hooksPath` back to `.husky/_` (either drop husky's
      auto-setup, or have `prepare` set the tracked path). Document whichever
      approach in the hook header.
- [ ] Hooks fail **closed**: if `node_modules` / `npx` tooling is absent the
      pre-commit must error and block the commit with a clear message (run
      `pnpm install`), never silently pass. `npx --no-install` already exits
      non-zero — verify and keep that property.
- [ ] Verify end to end: create a worktree with raw `git worktree add` (NOT
      `start-worktree.sh`), stage a deliberately mis-formatted `.md`, and
      confirm the commit is blocked / auto-fixed rather than landing dirty.
- [ ] `start-worktree.sh` still works and is idempotent with the new setup
      (no double-config, no revert).

## Notes

- `.husky/pre-commit` is a plain `sh` script (no husky sourcing line), so it
  is directly runnable as a `core.hooksPath` target.
- This is the durable fix for a recurring `main`-red class; the interim
  mitigation (always create worktrees via `start-worktree.sh`) stays valid
  until this lands.
- Tooling/guardrails change only — no story-content edits.
