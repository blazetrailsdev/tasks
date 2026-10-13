---
title: "Tag the last commit on main whose source of truth is Rails v8.0.2"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: release
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

RFC § 5. trails has no release tags. The recommendation is an annotated tag
`rails-8.0.2` on the last `main` commit before the flip, and no stable branch
(Open question 6). The tag is placed after the flip merges, on the flip
commit's parent, so there is no window in which another PR can land between
the tagged commit and the flip.

Creating a tag on trails is outward-facing and is the owner's action, or an
agent's only on the owner's explicit go-ahead in that session.

## Acceptance criteria

- [ ] The flip PR has merged. The commit to tag is its parent on `main`
      (the first parent of the squash commit), and `vendor/sources.ts` at
      that commit still reads `ref: "v8.0.2"`.
- [ ] Every CI job on that commit's `main` run was green.
- [ ] An annotated tag `rails-8.0.2` exists on that commit and is pushed. Its
      message carries the `parity:api` and `parity:test` summary rows for
      every package and the Rails SHA
      `3235827585d87661942c91bc81f64f56d710f0b2`.
- [ ] No branch is created.

## Definition of done

A lightweight tag, or a tag on a commit that already has `ref: "v8.1.4"`,
does not close this story.
