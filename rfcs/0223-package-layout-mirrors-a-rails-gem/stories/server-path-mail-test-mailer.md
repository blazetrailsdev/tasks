---
title: "server-path-mail-test-mailer"
status: draft
updated: 2026-11-06
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/server-path-closure.ts` (RFC 0223) finds these testing modules reachable from a non-testing export of the built tree, each a row of `scripts/layout/server-path-closure-exclude.json` naming this story:

- `packages/mail/dist/network/delivery-methods/test-mailer.js`, from `@blazetrails/actionmailbox`.

The mail gem defines `Mail::TestMailer` as a delivery method, loaded by `mail.rb` itself; decide whether the path heuristic (`test-` file name importing vitest) or the import is wrong, and fix the cause.

## Acceptance criteria

- [ ] No non-testing export (including each `./*` wildcard expansion) of the built tree reaches these modules; they are reached only through testing subpath exports, or moved to `test/` when test-suite-private.
- [ ] Their rows are deleted from `server-path-closure-exclude.json`.
