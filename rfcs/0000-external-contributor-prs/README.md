---
rfc: "0000-external-contributor-prs"
title: "PRs from external contributors: no automation by default, owner-approved reviews"
status: draft
created: 2026-11-19
updated: 2026-11-19
owner: "@deanmarano"
packages: []
clusters:
  - trust-gate
  - external-review
related-rfcs:
  - "0136-trailmap"
  - "0200-github-ingestion-in-trailmap"
  - "0249-ringo-changes"
---

# RFC — PRs from external contributors: no automation by default, owner-approved reviews

## Summary

Every PR so far has come from one account, and the automation is built
around that. ringo assigns a reviewer, requests Copilot, relays reviews into
agent panes, fixes CI and merges. None of that should happen on a PR from
someone else. This RFC makes ringo sort every PR author into **trusted** or
**external**, with external as the default. An external PR gets no
automation that writes to GitHub. Instead it lands in a trailmap inbox. From
there the owner can ask for a review agent, which drafts comments but cannot
post. The owner edits each draft in a text box, approves or discards it, and
sends the review from trailmap. Nothing reaches the contributor unless the
owner has read it, edited it as needed, and clicked send.

## Motivation

Measured against ringo `9c89ab4` (`deanmarano/btwebooks`):

- **Missing allow-list means allow everyone.** `prAuthorAllowed`
  (`webhook/handler.go:696`) returns `true` when `ALLOWED_PR_AUTHORS` is
  empty ("open mode", `handler.go:102`). If the env var is unset or lost in a
  redeploy, a stranger's PR gets a reviewer and Copilot, and every later
  automation step runs on it.
- **The gate is repeated in each handler.** It is checked separately in
  `handlePROpened` (`:703`), `handlePRReadyForReview` (`:775`),
  `handleReviewRequested` (`:850`), the poll backfill (`:1002`),
  `handleMerge` (`:1228`) and `handlePREvent` (`:2419`). `handleCheckRun`
  (`:1640`), `handleWorkflowRun` (`:1861`), `handlePRBodyEdited` (`:5480`), the
  CI fixer (`ci_fixer.go`), the merge sweep (`mergesweep.go`) and the
  reviewer nudge (`reviewer_nudge.go`) have no author check. They are only
  safe because their inputs come from a reviewer entry that the gated
  handlers created. A new handler can skip the check and nothing fails.
- **No path for a human review.** Reviews are either a Copilot request or an
  agent pane that holds a write-capable `gh`. There is no step where a draft
  waits for the owner.
- **External text is untrusted input to agents.** A contributor writes their
  PR body, commit messages, code comments and review replies. Any of them can
  carry instructions to an agent. Today agents only see text from the owner
  and Copilot.

## Design

### Trust classification (ringo)

- One function, `classifyPR(owner, repo, pr) → trusted | external`. It is
  trusted only if the author's login is in `TRUSTED_PR_AUTHORS` **and** the
  head repo is the base repo (not a fork). With an empty list, every PR is
  external: the gate is closed by default. `ALLOWED_PR_AUTHORS` is read as an
  alias for one release, then removed.
- Bots ringo creates PRs as (the CI fixer and stats fixer accounts, if any
  differ from the owner) go on the list explicitly. Nothing is trusted
  implicitly.
- Every PR-scoped entry point calls it once at the top, including the
  handlers that are ungated today. A table-driven test sends an external
  author's payload to each handler and asserts that no `gh` write ran, no
  reviewer entry was made and no pane was spawned or typed into.
- Trust can be granted per PR: an owner action in trailmap
  (`POST /api/pr-trust {repo, pr}`) promotes one PR to trusted. This covers a
  collaborator the owner wants fully automated without adding them to the
  global list. The promotion records who granted it and when. A later push by
  a different login, or a force-push that changes the head repo, revokes it.

### External PR intake (ringo → trailmap)

An external PR's `opened`, `synchronize`, `reopened`, `closed`, comment and
review events are not dropped. ringo records them and emits
`external_pr.*` on `/events`, and trailmap shows them. GitHub sees nothing
from us until the owner acts.

### Drafted review (ringo spawn, trailmap editor)

1. In trailmap the owner clicks **Draft review** on an external PR, with an
   optional focus note.
2. ringo `POST /external-review/start {repo, pr, focus}` spawns a review
   agent in a fresh worktree checked out at `refs/pull/<n>/head`.
   - **No GitHub write credential.** The pane starts with `GH_TOKEN` set to a
     read-only fine-grained PAT (`contents:read`, `pull_requests:read`,
     `metadata:read` on the tracked repos), so the agent can still
     `gh pr view` / `gh api` GET for context. The owner creates the PAT;
     it is stored only in ringo's env file as `EXTERNAL_REVIEW_GH_TOKEN`,
     and ringo refuses to start an external review when it is unset. An agent
     constraint (`agent_constraints.go`) also forbids `gh pr review|comment`.
     It is a second layer and not the boundary.
   - **Their code does not run on the host.** The review agent reads the diff
     and the repo. It does not run `pnpm install`, tests or scripts from the
     PR. CI runs on GitHub, behind the fork-workflow approval setting (see
     Rollout).
   - **PR text is quoted as data.** The prompt wraps the PR body, commits and
     discussion as untrusted content and says so.
3. The agent writes `review-draft.json`: a summary, a suggested event
   (`COMMENT` / `REQUEST_CHANGES` / `APPROVE`), and a list of
   `{path, line, side, body, rationale}`. ringo stores it and serves it at
   `GET /api/external-reviews?repo=&pr=`, and emits
   `external_review.drafted` on `/events`; trailmap ingests the draft from
   there. `rationale` is shown only to the owner and
   is never sent.
4. trailmap's PR page shows each draft comment as an **editable textarea**
   next to its diff hunk, with approve and discard controls. The summary and
   the event selector are editable too. The owner can add comments of their
   own. **Redraft** on one comment sends an instruction ("shorter", "ask,
   don't tell") back to the parked review session and replaces only that
   draft.
5. **Send** posts one GitHub review with the owner's token. It contains
   exactly the approved text as it stands in the boxes, with no
   post-processing. It is idempotent on the draft id. trailmap stores the
   sent text and the GitHub review id, alongside the original draft, for
   audit.

When the contributor pushes again, the draft is marked stale and stays
editable. **Redraft all** starts a new review against the new head.

### Merging an external PR

ringo never auto-merges an external PR. Merging is a manual GitHub action.
After the merge, `handleMerge` runs only its local bookkeeping (story
`done`, worktree cleanup), because the merge itself was the owner's
decision. It is the one exemption from the trust gate's early return, and it
makes no `gh` writes for an external PR.

### tasks

There is no schema change. `pr: trails#N` already accepts any PR. A story an
external contributor is working on keeps `claim: null` and
`assignee: <their login>`. An external PR never creates tasks rows by
itself; it is linked to an existing story, or to none. The spawn loop already skips stories whose
`assignee` is not empty, and the story
`spawn-loop-skips-externally-assigned-stories` adds a test that pins this.

## Non-goals

- **Contributor-facing docs (CONTRIBUTING, CLA, code of conduct):** these
  are trails-repo content. They deserve their own RFC once there is a first
  contributor.
- **Automated reviews of external PRs with a delay or rate limit:** every
  word posted to a stranger is approved by the owner. That is the point of
  this RFC.
- **Running external code in a sandbox (container or VM) for local tests:**
  GitHub CI covers it. If that stops being enough, sandboxing gets its own
  RFC.
- **Multiple human reviewers or roles:** the owner is the only approver.

## Alternatives considered

- **Keep `ALLOWED_PR_AUTHORS` and set it everywhere:** this keeps the
  fail-open default and the gate repeated per handler, the two problems this
  RFC fixes.
- **Let the agent post, with the owner approving in GitHub's pending-review
  UI:** a pending review needs a write credential in the agent's pane, and
  GitHub's editor does not show the rationale. trailmap keeps the credential
  out of reach of anything a stranger's text can steer.
- **Copilot review on external PRs:** it posts straight to the contributor
  with no approval step.

## Rollout

1. `ringo-classify-pr-trust-closed-by-default` (trust-gate). Deploy it with
   `TRUSTED_PR_AUTHORS` set before merging. Then confirm on GitHub that
   **Settings → Actions → "Require approval for all external
   contributors"** is on for every tracked repo (a manual step, recorded in
   the story's PR).
2. `ringo-emits-external-pr-events` and
   `spawn-loop-skips-externally-assigned-stories` (independent).
3. `trailmap-external-pr-inbox` (needs 2) and
   `ringo-external-review-draft-spawn` (needs 1).
4. `trailmap-review-draft-editor` (needs 3), then
   `trailmap-sends-approved-review-to-github`, `ringo-per-pr-trust-grant`
   and `trailmap-redraft-a-single-comment`.

The trailmap stories that call new ringo endpoints also need the vendored
ringo pin bumped (`0136-trailmap`, as in `0249-ringo-changes`). The bump is
done inside the first trailmap story that needs it.

## Verification

- With `TRUSTED_PR_AUTHORS` empty, the handler table test shows 0 `gh`
  writes, 0 reviewer entries and 0 pane spawns or sends for an external PR
  across every PR-scoped handler.
- A dry run from a second GitHub account (fork PR against `tasks`): the PR
  shows in the trailmap inbox and nothing is posted to GitHub. A drafted
  review with one edited comment and one discarded comment is sent, and the
  GitHub review contains exactly the edited text (1 manual run, recorded in
  `trailmap-sends-approved-review-to-github`'s PR).
- 9 of 9 stories done.

## Open questions

None open.

## Changelog

- 2026-11-19: initial RFC
- 2026-11-19: review fixes — `handleMerge` bookkeeping exempted from the
  gate; drafts served by ringo, ingested by trailmap; read-only PAT decided;
  Redraft all assigned to the editor story
