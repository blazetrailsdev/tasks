---
title: "Port LoadError for the three require stand-ins raising bare Error"
status: draft
updated: 2026-08-13
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Three sites throw a bare `Error` where Ruby raises the core `LoadError`, each with
an `eslint-disable blazetrails/rails-error-parity` and a call-site note saying
there is no Rails error class to port:

- `packages/activesupport/src/xml-mini.ts` — `castBackendNameToModule`'s unknown-name
  arm, standing in for `require "active_support/xml_mini/#{name.downcase}"`
  (`vendor/rails/activesupport/lib/active_support/xml_mini.rb:200-206`). Added by
  PR #6481.
- `packages/activesupport/src/yaml.ts:16` — the `require "yaml"` stand-in.
- `packages/activesupport/src/cache/store-registry.ts` — `lookupStoreClass` returns
  `undefined` "where Ruby's `require` would raise `LoadError`"
  (`vendor/rails/activesupport/lib/active_support/cache.rb`'s store lookup).

The claim in those notes is only half true: `LoadError` is a Ruby **core** class,
not a Rails one, but trails ports core Ruby error classes elsewhere (e.g.
`RuntimeError` in `packages/activesupport/src/rexml/document.ts`, which
`xml-mini-engine.test.ts` asserts against), so "no Rails class" is not by itself a
reason for a bare `Error`. A caller cannot currently distinguish a missing-backend
failure from any other `Error`.

## Converged shape

One ported `LoadError` (alongside the existing core-error ports), raised by all
three sites with Ruby's message shape
(`cannot load such file -- <path>`), and the three `rails-error-parity` disables
removed.

## Acceptance criteria

- [ ] A `LoadError` class exists at the trails path matching where the other core
      Ruby error ports live, and is exported the way they are.
- [ ] All three sites above raise it; no `eslint-disable blazetrails/rails-error-parity`
      remains at any of them.
- [ ] `xml-mini.trails.test.ts`'s unknown-backend-name case asserts the class, not
      just the message string.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
