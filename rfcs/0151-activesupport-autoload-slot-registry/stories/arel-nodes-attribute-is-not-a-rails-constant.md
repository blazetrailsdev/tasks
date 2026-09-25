---
title: "arel-nodes-attribute-is-not-a-rails-constant"
status: in-progress
updated: 2026-09-25
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 26
pr: trails#8094
claim: "2026-09-25T16:19:00Z"
assignee: "seat-nested-namespaces-on-active-record"
blocked-by: null
closed-reason: null
---

## Context

`Arel.Nodes` is now the `Autoload`-extended object in `packages/arel/src/namespaces.ts`, and every
class seats itself on it in its defining module (arel-public-namespaces-are-not-the-autoload-namespaces).
`packages/arel/src/attributes/attribute.ts` seats `Nodes.Attribute = Attribute` only to keep the
old `export { Attribute } from "../attributes/attribute.js"` in `packages/arel/src/nodes/index.ts`
working.

Rails has no `Arel::Nodes::Attribute`. The class is `Arel::Attributes::Attribute`
(`vendor/rails/activerecord/lib/arel/attributes/attribute.rb:4-5`), aliased as `Arel::Attribute`
at `attribute.rb:32` (`Attribute = Attributes::Attribute`). trails already seats both
(`Attributes.Attribute`, `Arel.Attribute`).

About 70 references spell `Nodes.Attribute` (`grep -rn "Nodes\.Attribute\b" packages/*/src`),
mostly in activerecord's relation / predicate-builder / join-dependency code, plus
`packages/arel/src/visitors/dot.ts` and a few tests.

## Acceptance criteria

- Every `Nodes.Attribute` reference is rewritten to the Rails spelling its Ruby counterpart uses
  (`Arel::Attributes::Attribute` → `Arel.Attributes.Attribute` / the `Attributes` namespace, or
  `Arel::Attribute` where Rails writes that).
- `Attribute` is removed from `packages/arel/src/nodes/index.ts`, the `Nodes.Attribute` seat in
  `attributes/attribute.ts` is deleted, and `Nodes.Attribute` drops out of the `Nodes` type
  namespace in `namespaces.ts`.
- `pnpm typecheck` and `packages/arel/src/namespaces.trails.test.ts` stay green.
