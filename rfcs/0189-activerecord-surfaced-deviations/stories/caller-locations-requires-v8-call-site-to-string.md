---
title: "caller-locations-requires-v8-call-site-to-string"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activesupport"]
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

`callerLocations` (`packages/activesupport/lib/deprecation.ts:123-148`) installs `Error.prepareStackTrace`, formats each call site with `${site}` and parses `at fn (file:line:col)`. Hermes calls `prepareStackTrace` but its call sites stringify as `[object CallSite]`, so the parse finds nothing and `Delegation`'s `callerLocations(1, 1)[0]` (`packages/activesupport/lib/delegation.ts:113-114`) reads `.path` of undefined while activerecord loads.

Found running `examples/react-native-notes` on an Android emulator (Expo Go, SDK 58, Hermes) for trails#10425, which works around it in the example; see its README row 16.

## Acceptance criteria

- `callerLocations` builds frames from the call-site getters (`getFileName`, `getLineNumber`, `getFunctionName`) rather than `toString`, or falls back to parsing `new Error().stack` when the formatted lines do not parse.
- `delegate` with no caller location found does not raise.
