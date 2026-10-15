---
title: "Psych.dump's canonical: true emits libyaml's canonical form"
status: blocked
updated: 2026-10-15
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps:
  - psych-yaml-tree-answers-a-node-tree-emitted-by-node-yaml
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: "waits on psych-yaml-tree-answers-a-node-tree-emitted-by-node-yaml (story's own AC: lands with or after it; node yaml backend has no canonical style)"
closed-reason: null
---

## Context

`Psych::Visitors::Emitter#initialize` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/emitter.rb:5-17`)
forwards `:indentation`, `:canonical` and `:line_width` to libyaml through `Handler::DumperOptions`.
`YAML.dump({"a"=>{"b"=>1}}, canonical: true)` prints the canonical form: flow collections,
explicit `? key : value` pairs, and quoted, tagged scalars (`! "1"`).

trails#8904 forwards `indentation` / `lineWidth` to the `yaml` package's `toString` in
`packages/ruby-compat/src/psych/visitors/yaml-tree.ts` (`get tree()`'s `yaml`). Because the backend has no canonical
style, `canonical: true` raises `NotImplementedError` there, by operator ruling.

## Acceptance criteria

- [ ] `Psych.dump(o, { canonical: true })` emits libyaml's canonical form, matching `ruby -ryaml` on
      a nested mapping, a sequence and a tagged object; the `NotImplementedError` arm is removed.
- [ ] Lands with or after `psych-yaml-tree-answers-a-node-tree-emitted-by-node-yaml`, which gives the emitter a place to own canonical style.
