---
title: "YAMLTree#tree answers Psych's node tree and Node#yaml emits it through a ported Visitors::Emitter"
status: ready
updated: 2026-10-15
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Psych::Visitors::YAMLTree#tree` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb:97-100`)
answers `@emitter.root`, a `Psych::Nodes::Stream`, and `Psych.dump` calls that node's own
`Psych::Nodes::Node#yaml` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/nodes/node.rb:58-64`), which runs
`Visitors::Emitter` (`visitors/emitter.rb`) over the node tree. libyaml writes a tagged root on the
`---` line.

trails (`packages/ruby-compat/src/psych/visitors/yaml-tree.ts`, `get tree()`, trails#8904) answers a
small object whose `yaml(io, options)` calls the `yaml` package's `Document#toString`. For a tagged root it
writes the `---` document start and the tag on one line itself, because the backend's `stringifyDocument` joins only a block scalar onto `---`.

## Acceptance criteria

- [ ] `YAMLTree#tree` answers a Psych node tree (`Nodes::Stream` / `Document` / `Mapping` / `Sequence` /
      `Scalar` / `Alias`, `nodes/*.rb`) and `Node#yaml` emits it through a ported `Visitors::Emitter`
      (`visitors/emitter.rb:19-…`) whose handler drives the backend, so the `--- !tag` placement comes
      from the emitter's document-start event rather than a special case in `tree`.
- [ ] `Psych.dump(Object.new)`-shaped output matches `ruby -ryaml` for tagged and untagged roots.
