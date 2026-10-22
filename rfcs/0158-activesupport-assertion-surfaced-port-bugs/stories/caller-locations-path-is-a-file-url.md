---
title: "callerLocations Location#path is a file:// URL, not a filesystem path"
status: draft
updated: 2026-10-14
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Thread::Backtrace::Location#path` is a filesystem path. trails'
`callerLocations` (`packages/activesupport/src/deprecation.ts:124-170`) keeps
V8's `file://` URL in `path` for ESM frames; only `absolutePath` is stripped
and decoded (`:151-155`).

`Mapping#routeSourceLocation`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts:905-912`) now reads
`location.path` alone, as Rails does
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:382-384`),
so its `startsWith(actionDispatchDir)` test and the cleaned path it renders
both see the `file://` URL when running from `dist`.

`Deprecation::Reporting#extract_callstack` reads
`frame.absolutePath ?? frame.path` (`deprecation.ts:292`); check that fallback
against Rails' body
(`vendor/rails/v8.0.2/activesupport/lib/active_support/deprecation/reporting.rb`,
`extract_callstack`).

## Acceptance criteria

- `callerLocations`' `path` is a decoded filesystem path for `file://` frames,
  matching Ruby's `Location#path`.
- `extract_callstack` reads the frame the way Rails' body does, with no
  `?? path` arm Rails lacks.
- A `.trails.test.ts` pins `path` for an ESM frame.
