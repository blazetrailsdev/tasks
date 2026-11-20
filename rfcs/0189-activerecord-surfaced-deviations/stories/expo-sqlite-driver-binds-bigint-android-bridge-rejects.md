---
title: "expo-sqlite-driver-binds-bigint-android-bridge-rejects"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["sqlite3"]
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

trails binds integer ids as `bigint` (an `INSERT INTO "notes" ("notebook_id", ...)` binds `1n`), and `expandBinds` (`packages/sqlite3/lib/expo-sqlite.ts:59`) passes them to expo-sqlite unchanged. expo-sqlite's Android bridge cannot marshal a `bigint` ("Cannot convert this JS value to a Java value"), so any query binding an id fails on Android.

Found running `examples/react-native-notes` on an Android emulator (Expo Go, SDK 58, Hermes) for trails#10425, which works around it in the example; see its README row 18.

## Acceptance criteria

- The expo driver binds a `bigint` that fits a safe integer as a `number` (and one that does not as a string, or raises `RangeError`), as the better-sqlite3 and node:sqlite drivers accept it natively.
- A driver test pins the bound values for a `bigint` id.
