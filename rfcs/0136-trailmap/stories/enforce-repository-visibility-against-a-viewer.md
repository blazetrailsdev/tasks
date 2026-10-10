---
title: "enforce repository visibility once there is a viewer to enforce it against"
status: draft
updated: 2026-10-10
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`repositories.visibility` exists, defaults to `public`, is validated as an
enum (`visibilityPublic` / `visibilityPrivate` scopes) and is DISPLAYED on the
owner page and the settings tab. Nothing enforces it: `/:owner/:repo` and all
eight tabs serve a `private` repository exactly as they serve a public one.

Found while reviewing trailmap#48, where `repo-controller.ts` had grown
docblocks justifying a 404-over-403 policy "because a 403 would tell an
anonymous reader that a private repository exists" — reasoning about an
enforcement the code does not have. That prose is gone; the column stays as
metadata, and this story is what makes it mean something.

The reason it was not simply enforced in that PR: trailmap has no viewer
identity. No sessions, no login, nothing that distinguishes a collaborator
from a stranger. The only enforcement available today is to hide the
repository from _everyone_, including the single operator who could change the
column back — and since the settings tab is read-only, that operator would
have to go to SQL to undo it. A switch whose only effect is to strand a
repository is worse than a column that is honestly labelled as decoration.

`repository_collaborators` (also trailmap#48) already carries the
authorization DATA — `read`/`write`/`admin` per owner per repo, on a composite
primary key. What is missing is the authenticated subject to match it against.

## Converged shape

An authenticated viewer, and `visibility` enforced against it:

- a session that identifies the viewer as an `Owner`;
- `RepoController`'s before-action 404s a repository the viewer cannot read —
  the same status as a missing repository and a disabled tab, which is the one
  piece of the old reasoning that was sound;
- `OwnersController` lists only the repositories the viewer can read, so a
  private repo does not appear with a `private` tag to a stranger;
- readability is `visibility === "public"` OR a `repository_collaborators` row
  for the viewer (any role), OR ownership.

## Acceptance criteria

- [ ] A controller test asks for a `private` repository's code tab as an
      anonymous viewer and gets 404; the same request as a collaborator gets 200. It fails on today's code, which serves both.
- [ ] The owner page omits private repositories from the list for a viewer who
      cannot read them, and includes them for one who can.
- [ ] Every tab goes through the same check — the test covers at least one tab
      besides code, so the check lives in `RepoController` and not in one
      action.
- [ ] `repo-controller.ts` documents the enforcement that now exists, and the
      note saying `visibility` is display-only is deleted.
