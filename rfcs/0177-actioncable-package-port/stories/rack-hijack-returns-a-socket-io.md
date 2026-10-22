---
title: "rack-hijack-returns-a-socket-io"
status: draft
updated: 2026-10-22
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raised reviewing trails#9206. `Handler::Node` hands `rack.hijack` callers a raw Node socket on both the upgrade path and (since trails#9206) ordinary requests (`packages/rack/src/handler/node.ts`, `service` / `upgrade`). `Rack::Lint#check_hijack` requires `rack.hijack` to return an `IO` (`vendor/rack/v3.1.14/lib/rack/lint.rb:591-603`), and the port enforces it with `io instanceof IO` (`packages/rack/src/lint.ts:495-497`). So a linted app that full-hijacks raises `LintError "rack.hijack must return an IO instance"`. ruby-compat has no socket-backed `IO` (`packages/ruby-compat/src/io.ts:533` is fd/fs only); Ruby's servers hand out a `TCPSocket`, an `IO` subclass (`BasicSocket < IO`).

## Acceptance criteria

- [ ] ruby-compat gains a socket-backed `IO` subclass at its Ruby name (`BasicSocket` / `TCPSocket`, `vendor/ruby/v3.3.11/ext/socket/`), wrapping the adapter's `HttpSocket`, with read / write / close / close_read / close_write as Lint's `StreamWrapper` needs (`lint.rb:` `StreamWrapper::REQUIRED_METHODS`).
- [ ] `Handler::Node`'s full hijack, on both paths, returns it; a test calls `rack.hijack` through `Rack::Lint` over a real listening handler and gets no `LintError`.
