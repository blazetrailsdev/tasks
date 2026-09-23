---
title: "Arel's public Nodes/Visitors namespaces are separate objects from the Autoload namespaces readers resolve against"
status: ready
updated: 2026-09-23
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging arel's node-slots onto `ActiveSupport::Autoload` (trails#7988, RFC 0151 Phase 2).

Ruby has exactly one `Arel::Nodes` module, one `Arel::Visitors`, one `Arel`: every `module Arel; module Nodes` reopening in `vendor/rails/activerecord/lib/arel/nodes/*.rb` adds to the same object, and `def self.build_quoted` (`arel/nodes/casted.rb:48`) lands on it.

trails now has **two** objects per namespace:

- the public ESM namespaces — `packages/arel/src/index.ts:2-3` (`export * as Nodes from "./nodes/index.js"`, `export * as Visitors from "./visitors/index.js"`), frozen module-namespace objects that a consumer reads as `Arel.Nodes.Not`;
- the internal `Autoload`-extended objects in `packages/arel/src/namespaces.ts` (`Arel`, `Attributes`, `Nodes`, `Visitors`), which the node readers resolve at call time (`new Nodes.Not(this)`), and on which `casted.ts` seats `Nodes.buildQuoted`.

So `Nodes.buildQuoted` exists on the internal object but not on the public one — the gap `arel-nodes-build-quoted-not-on-namespace` (0023 bucket) describes — and any future `def self.` on a Ruby namespace hits the same split.

## Converged shape

One object per Ruby namespace. The public `Nodes` / `Visitors` exports (and whatever stands for `Arel` itself) are the `Autoload`-extended objects from `namespaces.ts`, with every public class seated on them by its defining module (as `Nodes.Not = Not` already is) rather than re-exported through an ESM namespace. `Nodes.buildQuoted` then reaches consumers for free, and `grouping.test.ts` can call it through the namespace (`vendor/rails/activerecord/test/cases/arel/nodes/grouping_test.rb:9`). Type exports keep working through a declaration-merged `namespace` or an explicit type map on the object; decide which by what `parity:api` credits.

If the public surface cannot move in one PR, split by namespace (Visitors is small; Nodes is ~100 classes).

## Acceptance criteria

- `Arel.Nodes` (public) and the object node readers resolve constants against are the same object; likewise `Arel.Visitors`.
- `Arel.Nodes.buildQuoted` is reachable publicly; close `arel-nodes-build-quoted-not-on-namespace` with this PR.
- `packages/arel/src/dist-entry-modules.trails.test.ts` stays green (no TDZ from any entry module).
- `parity:api:extra:gate` arel stays pinned at novel 0; `total` does not rise.
