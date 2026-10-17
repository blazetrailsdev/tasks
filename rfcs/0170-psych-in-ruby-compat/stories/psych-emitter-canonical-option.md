---
title: "Psych.dump's canonical: true emits libyaml's canonical form"
status: closed
updated: 2026-10-17
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
blocked-by: null
closed-reason: "Blocker psych-yaml-tree-answers-a-node-tree-emitted-by-node-yaml landed (trails#8958); the vendored libyaml emitter port (trails#8970/#8974/#8977) implements canonical style: ruby-compat/src/psych/emitter.ts honors canonical, the NotImplementedError arm is gone, and psych.trails.test.ts:310 'Psych.dump canonical' asserts libyaml's form on origin/main."
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
