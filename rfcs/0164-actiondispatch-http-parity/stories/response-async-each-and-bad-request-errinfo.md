---
title: "response-async-each-and-bad-request-errinfo"
status: done
updated: 2026-10-15
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8941
claim: "2026-10-15T15:55:17Z"
assignee: "http-call-baselines-and-residue"
blocked-by: null
closed-reason: null
---

# Ratify or converge Response's async body iteration and BadRequest's `$!` errinfo

## Context

trails#8923 left two receipted deviations in actionpack:

- `Buffer[Symbol.asyncIterator]`, `RackBody[Symbol.iterator]` and `RackBody[Symbol.asyncIterator]`
  (`packages/actionpack/src/action-dispatch/http/response.ts`). Rails' `RackBody#each` → `Response#each`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/response.rb:77-82`, `:526-528`) is sync. trails' Rack
  handlers stream async (`packages/rack/src/handler/node.ts:78`), and `Live::Buffer` chunks arrive via a Queue.
  No CLAUDE.md section ratifies the JS iteration protocols as the port of `each`.
- `ActionController::BadRequest`'s constructor takes `errinfo` in place of Ruby's `$!`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/exceptions.rb:10-13`). ruby-compat's
  `excSetupMessage` (`packages/ruby-compat/src/exception.ts`) passes `$!` the same explicit way, but
  that is not ratified as a repo-wide rule either.

## Acceptance criteria

- Either a CLAUDE.md section, ratified by the repo owner, covers both shapes and the receipts become `PERMANENT`,
  or the shapes are converged (a ruby-compat current-exception carrier; a sync-only body protocol) and the receipts are removed.
