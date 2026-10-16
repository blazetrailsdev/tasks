---
title: "YAMLTree emits events into a ported Psych::TreeBuilder instead of building nodes directly"
status: ready
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Psych::Visitors::YAMLTree` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb`) emits events into `@emitter`, a `Psych::TreeBuilder` (`tree_builder.rb`). For example: `@emitter.scalar(...)`, `@emitter.start_mapping(...)`, `register o, @emitter.start_mapping(...)`, `@emitter.start_document version, [], false` in `push` (`:103-119`), and `tree` returns `@emitter.root` (`:97-100`).

After trails#8958, `packages/ruby-compat/src/psych/visitors/yaml-tree.ts` builds the `Psych::Nodes` tree directly: it calls `new Scalar(...)` / `new Mapping(...)` and pushes into `children`, and `push` constructs a `Document` itself. It has no `TreeBuilder`, no `start`/`finish`/`started?`/`finished?` (`:79-95`), and no `header` / `version` options in `push`.

## Acceptance criteria

- [ ] Port `Psych::Handler` (`handler.rb`) and `Psych::TreeBuilder` (`tree_builder.rb`). `YAMLTree` drives a `TreeBuilder` through the same event calls `yaml_tree.rb` makes, and `tree` returns `@emitter.root`.
- [ ] Port `YAMLTree#start`/`finish`/`push`, including the `:header`/`:version` arms.
- [ ] Existing Psych dump tests stay green.
