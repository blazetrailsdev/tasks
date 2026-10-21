---
title: "Gate: a ratified CLAUDE.md section has a decision-history entry, and vice versa"
status: draft
updated: 2026-10-21
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: lint
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Root CLAUDE.md's header says: "The history behind each ratified decision —
alternatives tried, measurements, the PRs that settled it — is in
[docs/claude-md-decision-history.md](docs/claude-md-decision-history.md)." The
history file's own header repeats it and adds the pairing rule: "Headings match
the CLAUDE.md section they belong to."

Nothing enforces either half. On trails#9180 a new ratified section — "A
translation lookup is synchronous; the load is an awaited step" — was written,
reviewed and had green CI with **no** history entry; the gap was found by hand
while re-grading, not by a gate, and the entry was added in a later commit of
the same PR.

The two halves are both checkable from the files alone:

- A ratified root or package CLAUDE.md section has no matching heading in
  `docs/claude-md-decision-history.md`.
- A heading in the history file matches no CLAUDE.md section — the stale
  direction, which happens when a section is renamed or moved to a package
  file (several root sections are now one-line pointers, and their history
  headings still have to resolve).

"Ratified" is identifiable from the text: the sections carry a closing
sentence of the form "ratified repo-wide here", "Ratified in
[packages/...]" or "Ruled by the repo owner on <date>". That phrasing is the
signal to key on, and the check should list what it matched so a false
positive is visible rather than silent.

## Converged shape

`scripts/claude-md-decision-history.test.ts`, in the Preflight job so it runs
on docs-only PRs (the shape of `scripts/vendor-citations.test.ts`), asserting
both directions over `CLAUDE.md` and `packages/*/CLAUDE.md`. A section that
genuinely needs no history entry is listed in one allowlist constant in the
test with a one-line reason, the way the repo's other guards carry their
exceptions.

Worth measuring before gating: run both directions over current main and put
the counts in the PR body. If the backlog of missing entries is large, the
test lands only-shrink against a committed mark rather than at zero, and the
backlog is filed as its own story.

## Acceptance criteria

- [ ] Both directions are checked and the test is registered in the Preflight
      CI job.
- [ ] The current main counts for each direction are in the PR body.
- [ ] A new ratified section with no history entry reds; a renamed section with
      a stale history heading reds.
- [ ] Any pre-existing gap is either filled in this PR or carried as a
      committed only-shrink mark with a story filed for the remainder.
