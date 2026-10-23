---
title: "rbModName derives a class's Ruby path from the registered namespace objects"
status: ready
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - seat-rule-is-plain-assignment-in-claude-md
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbModName` is `classpaths.get(klass)?.path ?? klass.name ?? null`
(`packages/ruby-compat/src/object.ts:474`; `rbModToS` at `:444`, `rbObjClass`'s
path read at `:460`, `Exception`'s at `exception.ts:43`, `Module#name` at
`include.ts:245`). The JavaScript fallback is already there; the `classpaths`
WeakMap (`packages/ruby-compat/src/classpath.ts:8`) exists only to supply the
`::` prefix, and it is filled by `rbModConstSet` at 790 declarations.

The prefix is derivable. All 39 namespace objects already carry their own
fully-qualified path in `name` — `{ name: "Arel::Nodes" }`,
`{ name: "ActiveRecord::ConnectionAdapters" }` — across the 13
`packages/*/src/namespaces.ts` files, each of which already calls
`registerConstant` for its root. So a seated class's path is
`owner.name + "::" + key`.

An eager walk does not work: a namespace is populated as its members' modules
evaluate, so it would run before the seats. The walk is therefore lazy and
memoized, which is the shape CLAUDE.md § "`inherited` is deferred to
own-property memo guards" already settles for a fact JavaScript gives no
definition-time hook for.

## Acceptance criteria

- [ ] `registerNamespace(ns)` is exported from ruby-compat and called once per
      namespace object in each `packages/*/src/namespaces.ts`, beside the
      existing `registerConstant` call.
- [ ] `rbModName` resolves in order: memoized path; `const_set`-bound path;
      derived `owner.name + "::" + key` from the first registered namespace
      holding `klass` as an own property, memoized on hit; `klass.name`; `null`.
- [ ] `rbModToS`, `rbObjClass`'s path read, `Module#name` and `Exception`'s
      class-name read all go through it, and `rbPathToClass` resolves a derived
      path.
- [ ] `classpaths` is documented as an internal memo of a derivation. No call
      site outside ruby-compat writes it; `rbSetClassPathString` is unaffected
      by this story.
- [ ] A ruby-compat test asserts a class seated by plain assignment onto a
      registered namespace answers its qualified path, that an unseated class
      answers `klass.name`, and that an anonymous class answers `null`.
- [ ] arel, whose 144 seats are already helper-bound, answers identical paths
      before and after this story — the derivation agrees with the recorded
      table. A disagreement is a bug in the derivation, not grounds to keep the
      write.
- [ ] Each touched package's built `dist` modules still load as ESM entry
      modules, per CLAUDE.md § "Call-time constant resolution".
