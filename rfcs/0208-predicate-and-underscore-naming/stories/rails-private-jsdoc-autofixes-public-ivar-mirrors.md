---
title: "Autofix `@internal` onto public ivar-mirror members"
status: draft
updated: 2026-10-26
rfc: "0208-predicate-and-underscore-naming"
cluster: ar-underscore-burndown
packages: ["scripts", "activerecord"]
deps: ["naming-shape-labels-in-extract-ts-api"]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The audit found 90 AR names / 151 sites that mirror a Ruby ivar and are TS-public with no `@internal`. Examples: `packages/activerecord/src/base.ts:1321-1324`, `core.ts:327,402,442,772-809`, `attribute-methods/dirty.ts:116-117`, `autosave-association.ts:28-39`, `persistence.ts:618,658`. In Ruby these are unreachable from outside, but `Host` interfaces keep them public in TS. Ruled 2026-10-26: `@internal` by autofix first.

The rule reads its facts from a manifest built from `rails-api.json` (`eslint/rails-private-methods.json`, from `pnpm rails-privates:manifest`). This story extends that manifest with the per-class ivar list from `rails-api-records-class-ivars`, so the rule itself needs no syntax-tree pass of its own.

## Acceptance criteria

- [ ] `blazetrails/rails-private-jsdoc` autofixes `@internal` onto a public member whose shape is `ivar`.
- [ ] Applied across AR, and `ivarPublic` for AR reaches the residue the autofix cannot reach.
