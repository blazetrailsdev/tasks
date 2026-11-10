---
title: "IMAP#find raises ArgumentError for a negative :count like Array#first"
status: draft
updated: 2026-11-10
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

`vendor/mail/2.8.1/lib/mail/network/retriever_methods/imap.rb:80` is
`uids = uids.first(options[:count]) if options[:count].is_a?(Integer)`.
For a negative count, Ruby's `Array#first(n)` raises `ArgumentError`
("negative array size", `vendor/ruby/v3.3.11/array.c` `ary_take_first_or_last_n`).
`packages/mail/lib/network/retriever-methods/imap.ts` (`find`) ports it as
`uids.slice(0, count)`, which a negative count silently turns into a
drop-from-the-end. `ruby-compat-native-required` (RFC 0194) rejects the
ruby-compat `first(enum, n)` helper on an Array receiver, so the native form
needs its own arm.

## Acceptance criteria

- [ ] `IMAP#find` raises `ArgumentError` with Ruby's message for an Integer
      `count` below 0, as `Array#first(-1)` does, while keeping the native
      `slice` for counts of 0 or more.
- [ ] A test in `imap.trails.test.ts` fails on the current code and passes
      after the change.
