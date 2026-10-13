---
title: "Tag the last commit on main whose source of truth is Rails v8.0.2"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: release
packages: [scripts]
deps: [retake-the-body-pin-floor-at-the-last-8-0-2-commit]
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
`rails-8.0.2` on the `main` commit immediately before the flip PR merges, and
no stable branch (Open question 6).

Creating a tag on trails is outward-facing and is the owner's action, or an
agent's only on the owner's explicit go-ahead in that session.

## Acceptance criteria

- [ ] The flip PR is open and green, and the commit to tag is the `main`
      commit it will merge onto.
- [ ] An annotated tag `rails-8.0.2` exists on that commit and is pushed. Its
      message carries the `parity:api` and `parity:test` summary rows for
      every package and the Rails SHA
      `3235827585d87661942c91bc81f64f56d710f0b2`.
- [ ] No branch is created.
- [ ] If the flip PR is rebased onto a later `main` before merging, the tag is
      moved to the new parent before anyone else fetches it, or the flip
      merges first and the tag is placed on its first parent.

## Definition of done

A lightweight tag, or a tag on a commit that already has `ref: "v8.1.4"`,
does not close this story.
