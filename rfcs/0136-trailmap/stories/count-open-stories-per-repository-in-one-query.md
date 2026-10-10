---
title: "the owner page counts open stories with one query per repository"
status: draft
updated: 2026-10-10
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`/:owner` prints an open-story count beside each repository, and it costs one
query per repository:

```ts
// app/controllers/owners-controller.ts (show)
for (const repo of repos) {
  rows.push({
    // ...
    openCount: await openCountForRepo(repo.name),
  });
}
```

`openCountForRepo` is already the cheap version — trailmap#48's review
replaced a `storiesForRepo(…).filter(…)` that plucked eight columns of every
story a repo has (nine thousand rows on `trails`) to arrive at one integer.
What is left is the loop: four repositories today, four queries, and the
docblock says plainly that this is the wrong shape at four hundred.

The scope rule makes the grouped version slightly more than a `GROUP BY`,
which is why it was not just written that way: a story belongs to the repo its
`pr` targets (`pr LIKE 'repo#%'`), and a story with NO `pr` belongs to the
content repo. So the grouped query has to produce the same two-relation union
`scopeRelations` produces, keyed by repository name.

Not urgent, and deliberately filed rather than left as a comment: the comment
has been true since the page was written and nothing prompts anyone to act on
it.

## Converged shape

One query answers every repository's open count, and `OwnersController#show`
reads it from a map instead of looping.

Something like a single pass over the open stories, grouping on the repo name
parsed out of `pr` and folding the null-`pr` rows into `CONTENT_REPO` — built
in `repo-scope.ts`, because that file is the only place allowed to decide
which repository a story belongs to (CLAUDE.md), and the controller must not
learn the rule.

```ts
// repo-scope.ts, roughly
export async function openCountsByRepo(): Promise<Map<string, number>>;
```

## Acceptance criteria

- [ ] `OwnersController#show` issues ONE query for the counts regardless of how
      many repositories the owner has, pinned by a query counter or by a test
      that asserts the controller calls the grouped helper rather than the
      per-repo one.
- [ ] The grouped counts equal `openCountForRepo` per repository, over a
      fixture that includes the content repo's unattributed stories and a
      repository with no stories at all (which must read 0, not be absent).
- [ ] The scope rule still lives only in `repo-scope.ts`.
- [ ] `openCountForRepo` stays for the single-repository callers, or goes with
      its last caller — not left as a second definition of the same rule.
