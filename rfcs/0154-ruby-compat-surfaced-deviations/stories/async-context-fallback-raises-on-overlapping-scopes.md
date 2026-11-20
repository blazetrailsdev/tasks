---
title: "async-context-fallback-raises-on-overlapping-scopes"
status: draft
updated: 2026-11-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

With neither `AsyncLocalStorage` nor TC39 `AsyncContext` (Hermes), `createFallbackAdapter` (`packages/ruby-compat/lib/async-context-adapter.ts:26-75`) keeps one `current` and raises "Overlapping async context scopes are not supported…" (`:42`) when two scopes interleave, so `Promise.all([Notebook.count(), Note.count()])` raises on React Native.

Found building `examples/react-native-notes` (trails#10425), which works around it in the example; see its README row 6.

## Acceptance criteria

- Overlapping async scopes on a host without `AsyncLocalStorage`/`AsyncContext` either work (e.g. a promise-propagating fallback) or the framework serializes the work it owns, so concurrent queries on one connection pool do not raise.
- A test runs two overlapping queries with the Node adapter unregistered.
