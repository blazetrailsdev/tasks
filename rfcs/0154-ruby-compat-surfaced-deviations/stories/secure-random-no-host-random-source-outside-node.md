---
title: "secure-random-no-host-random-source-outside-node"
status: draft
updated: 2026-11-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SecureRandom.genRandom` (`packages/ruby-compat/lib/secure-random.ts:30-38`) raises `NotImplementedError("No random device")` when neither Node's crypto nor `globalThis.crypto.getRandomValues` exists, and `establishConnection` reaches it through `Instrumenter#unique_id`. Hermes has no Web Crypto, so connecting raises unless the app polyfills it.

Found building `examples/react-native-notes` (trails#10425), which works around it in the example; see its README row 7.

## Acceptance criteria

- ruby-compat exposes a documented way for a host to supply a random source (registering a crypto adapter, as fs/process already allow), and the README for non-Node hosts names it.
- The raise stays Ruby's when no source is supplied.
