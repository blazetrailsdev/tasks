---
title: "POP3#find raises ArgumentError for a negative :count like Array#first"
status: ready
updated: 2026-11-11
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/mail/2.8.1/lib/mail/network/retriever_methods/pop3.rb:64` is
`mails = mails.first(options[:count]) if options[:count].is_a? Integer`. Ruby's
`Array#first(-n)` raises `ArgumentError` ("negative array size"). trails'
`packages/mail/lib/network/retriever-methods/pop3.ts` `find` writes
`mails.slice(0, opts.count)`, which silently drops the last `n` mails instead.
The IMAP sibling, `imap-find-negative-count-raises`, has the same gap.

## Acceptance criteria

- [ ] `POP3#find` raises `ArgumentError` for a negative integer `:count`, the
      way `Array#first` does. Use a ruby-compat `first(array, n)` if one exists;
      otherwise share the converged shape with the IMAP story.
- [ ] A test in `pop3.test.ts` (trails-only extras section) covers it.
