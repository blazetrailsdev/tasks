---
title: "Psych.parse answers Psych::Nodes and ToRuby visits them (Node#to_ruby, #each, predicates)"
status: ready
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Psych::Nodes::Node#to_ruby` / `#each` and the `alias?`/`document?`/`mapping?`/`scalar?`/`sequence?`/`stream?` predicates (`vendor/ruby/v3.3.11/ext/psych/lib/psych/nodes/node.rb:31-74`) are unported. The `Stream::ANY`/`UTF16LE`/`UTF16BE` constants (`nodes/stream.rb:10-21`) are also unported.

trails#8958 ported `packages/ruby-compat/src/psych/nodes/*.ts` for the dump side only. `Psych.parse` still answers the npm `yaml` backend's nodes, and `ToRuby` (`psych/visitors/to-ruby.ts`) visits those nodes. In Ruby, `Psych.parse` answers `Psych::Nodes` built by `Parser` + `TreeBuilder` (`psych.rb`, `parse_stream`).

## Acceptance criteria

- [ ] `Psych.parse` / `parse_stream` answer `Psych::Nodes`. The `yaml` backend is driven as a `Psych::Parser` handler that feeds a `TreeBuilder`.
- [ ] `ToRuby` visits `Psych::Nodes` with `visit_Psych_Nodes_*` dispatch (`visitors/to_ruby.rb`).
- [ ] `Node#to_ruby` / `#each`, the type predicates and the `Stream` encoding constants are ported.
