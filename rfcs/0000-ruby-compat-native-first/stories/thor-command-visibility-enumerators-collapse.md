---
title: "Thor command: rbObjMethods / PublicMethods / PrivateMethods / ProtectedMethods have one caller and answer the same set"
status: draft
updated: 2026-10-16
rfc: "0000-ruby-compat-native-first"
cluster: inline
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

All four are imported only by `packages/trailties/src/thor/command.ts`. Under
CLAUDE.md "Method visibility is compile-time only", public, private and
protected enumerate the same names at run time.

## Acceptance criteria

- [ ] `command.ts` keeps Rails' call structure with one local enumerator, and the four exports are deleted.
- [ ] Thor command tests pass.
