---
title: "ruby-compat-io-read-async-to-eof"
status: done
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9770
claim: "2026-11-06T02:28:02Z"
assignee: "ruby-compat-io-read-async-to-eof"
blocked-by: null
closed-reason: null
---

## Context

`Mail.read` (`vendor/mail/2.8.1/lib/mail/mail.rb:168-170`) is
`self.new(File.open(filename, 'rb') { |f| f.read })`. The port in
`packages/mail/src/mail.ts` calls `IO.binreadAsync` instead, because
ruby-compat's `IO#read` with no length (`packages/ruby-compat/src/io.ts`,
`read`) reads with `readSync`, and `File.openAsync`'s block form has no
async read-to-EOF to call. `IO#readAsync` takes a required length.

## Acceptance criteria

- `IO#readAsync` accepts no length and reads to EOF over the backend's async
  read (`io_read`, `vendor/ruby/v3.3.11/io.c:3774`).
- `Mail.read` is `File.openAsync(filename, "rb", (f) => f.readAsync())`, and its
  `@missingRailsCall open` / `read` receipts are removed.
