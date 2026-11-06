---
title: "Port ActionMailbox's ingress rake tasks (exim, postfix, qmail)"
status: ready
updated: 2026-11-06
rfc: "0216-actionmailbox-port"
cluster: amb-ingress
packages: ["actionmailbox"]
deps: ["actionmailbox-relayer"]
deps-rfc: []
est-loc: 200
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionmailbox/lib/tasks/ingress.rake:3-72`: `action_mailbox:ingress:environment`
(requires `action_mailbox/relayer`), and `exim`, `postfix`, `qmail`, each
reading `URL` / `INGRESS_PASSWORD` from `ENV`, printing the usage line and
exiting (64, 1 with "4.3.5 …", 111) when either is blank, then relaying
`STDIN.read` and exiting by `Result` (exim 0/75/69, postfix
`exit result.success?`, qmail 0/111/100). No Rails test covers them.

`packages/rake` is ported (RFC 0211); the engine's rake tasks load the way
activestorage's do.

## Acceptance criteria

- The four tasks are ported in a `.ts` Rakefile module at the Rails path, with
  Rails' `desc` text, messages and exit codes.
- A trails test drives `postfix` and `exim` against an in-process ingress
  server and asserts stdout and the exit status.
