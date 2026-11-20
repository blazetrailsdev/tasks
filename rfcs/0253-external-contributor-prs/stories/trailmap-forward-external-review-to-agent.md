---
title: "trailmap + ringo: forward an external review on an agent PR, in the owner's words"
status: draft
updated: 2026-11-19
rfc: "0253-external-contributor-prs"
cluster: external-review
packages: []
deps: [ringo-classify-pr-trust-closed-by-default, trailmap-external-pr-inbox]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The trust gate stops reviews and comments from external logins on trusted
PRs before they reach the agent's pane. The owner still needs a way to act
on a useful one.

## Acceptance criteria

- ringo emits `external_review.on_trusted_pr` for such reviews and comments,
  and the inbox lists them under the PR.
- **Forward to agent** opens a text box prefilled with a suggested
  instruction, which the owner edits. On send, ringo types the owner's text
  into the PR's pane, followed by the reviewer's words in a block marked as
  untrusted quoted input.
- The inbox row also offers **Reply** through the draft/edit/send path.
- A test asserts that nothing reaches the pane without the forward action.
