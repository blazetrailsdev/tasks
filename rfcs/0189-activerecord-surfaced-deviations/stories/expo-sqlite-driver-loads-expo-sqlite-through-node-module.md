---
title: "expo-sqlite-driver-loads-expo-sqlite-through-node-module"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
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

The React Native driver needs Node: `packages/activerecord/lib/sqlite/expo-sqlite.ts:2` imports `createRequire` from `node:module` and `:51` loads the module with `createRequire(import.meta.url)("expo-sqlite")`. Metro cannot resolve `node:module`, so any app importing `connection-adapters/expo-sqlite-adapter.js` fails to bundle.

Found building `examples/react-native-notes` (trails#10425), which works around it in the example; see its README row 1.

## Acceptance criteria

- The expo driver loads `expo-sqlite` without `node:module` (a static import, or a module the caller passes in), and `isExpoSqliteAvailable` still answers false where it is absent.
- An Expo/Metro bundle of the adapter builds with no `node:module` resolver shim.
