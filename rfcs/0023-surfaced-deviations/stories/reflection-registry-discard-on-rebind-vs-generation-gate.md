---
title: "Converge reflection memo invalidation onto Zeitwerk discard semantics (drop the trails-invented generation gate)"
status: draft
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: ["reflection-registry-poison-actual-mechanism"]
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

PR #4863 added a `generation` counter to `modelRegistry` (`associations.ts`) and
gated every klass-derived reflection memo on it, so a registry mutation
re-resolves `klass` / `inverseOf` / through+source instead of serving a stale
target. It works and is documented, but it is a **trails invention with no Rails
analog**, and per the repo norm (converge, never ratify) the deviation should be
tracked rather than left as the permanent shape.

Rails memoizes unconditionally and has no registry at all:

- `@klass ||= compute_class(class_name)` — reflection.rb:422-423
- `@klass ||= delegate_reflection._klass(class_name)` — reflection.rb:989-990
- `@inverse_of ||= klass._reflect_on_association inverse_name` — reflection.rb:258-261

Rails is safe without any gate because reloading is _wholesale_: Zeitwerk discards
the model classes AND their reflection objects together, so a memo can never
outlive the class it resolved against. trails instead keeps one long-lived
`modelRegistry` per vitest worker that test files re-register into, which is what
makes a stale memo reachable at all.

The convergent end-state is therefore to mirror Zeitwerk's discard semantics —
re-registration drops the affected reflections (so they are rebuilt fresh) —
rather than keeping per-memo generation gating. That would let `klass` return to
Rails' bare `@klass ||=` shape and delete the counter, the gates, and
`stampGeneration`.

Note the mechanism finding in `reflection-registry-poison-actual-mechanism`:
instrumentation shows the repro has ZERO rebinds and 184 fresh registrations, so
whatever design replaces the gate must also handle memos formed under an
incomplete registry, not just rebinds. Resolve that story first — it may change
the shape of this one.

## Acceptance criteria

- [ ] Decide (with the mechanism story's evidence) whether discard-on-register is
      viable, or whether the generation gate is the right permanent shape for a
      shared-registry harness.
- [ ] If viable: re-registration discards the affected reflections; `klass`,
      `inverseOf`, and the through/source memos return to Rails' unconditional
      `||=` shape; the generation counter, gates, and `stampGeneration` are deleted.
- [ ] The `reflection-klass-cache-self-heal` two-file repro stays green either way:
      `pnpm vitest run --no-file-parallelism
  packages/activerecord/src/associations/nested-through-associations.test.ts
  packages/activerecord/src/associations.test.ts`
- [ ] `reflection.trails.test.ts` self-heal guards updated or removed to match the
      chosen design (they encode the gate's semantics, not Rails').
- [ ] Ratifying the current gate is an acceptable outcome ONLY with a written
      justification of why Zeitwerk-style discard cannot work here; record it in
      the RFC rather than closing silently.
