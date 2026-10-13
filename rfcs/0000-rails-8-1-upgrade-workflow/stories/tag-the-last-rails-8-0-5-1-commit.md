---
title: "Tag the last commit on main whose source of truth is Rails v8.0.5.1"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: flip
packages: [scripts]
deps: [flip-the-rails-ref-to-v8-1-4]
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 5: every Rails flip tags its parent `rails-<old>`. With the rehearsal,
the last 8.0 commit mirrors `v8.0.5.1`, so the 8.1.4 flip's parent takes
`rails-8.0.5.1`. `tag-the-last-rails-8-0-2-commit` places `rails-8.0.2` on the
rehearsal flip's parent the same way.

Creating a tag on trails is outward-facing and is the owner's action, or an
agent's only on the owner's explicit go-ahead in that session.

## Acceptance criteria

- [ ] The 8.1.4 flip PR has merged. The commit to tag is its single parent on
      `main`, and `vendor/sources.ts` there still reads `ref: "v8.0.5.1"`.
- [ ] An annotated tag `rails-8.0.5.1` exists on that commit and is pushed.
      Its message carries the `parity:api` and `parity:test` summary rows for
      every package and the Rails SHA the lockfile names at that commit.
- [ ] If that commit's `main` CI run was not green, the tag message names the
      run and the failing job, and cites the flip PR's green CI on the same
      tree.
- [ ] No branch is created.

## Definition of done

A lightweight tag does not close this story.
