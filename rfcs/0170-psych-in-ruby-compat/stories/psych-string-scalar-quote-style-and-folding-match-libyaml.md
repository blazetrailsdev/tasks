---
title: "Psych string scalars: single-quote style and 80-column folding match libyaml"
status: draft
updated: 2026-10-15
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
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

`YAMLTree#visitString` (`packages/ruby-compat/src/psych/visitors/yaml-tree.ts`) leaves the backend's scalar style for strings that need quoting, so output differs from libyaml as driven by `yaml_tree.rb` `visit_String` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb:272-310`):

- `YAML.dump("a: b")` is `"--- 'a: b'\n"` in MRI 3.3; trails emits `"--- \"a: b\"\n"` (double quotes). Same for `"it's: x"` (MRI `'it''s: x'`).
- `YAML.dump("a b " * 30)` folds the single-quoted scalar at 80 columns with a 2-space continuation in MRI; trails double-quotes and folds at a different column.

## Acceptance criteria

- [ ] A string that libyaml would emit single-quoted (`Nodes::Scalar::SINGLE_QUOTED` / ANY style resolved by the emitter) is emitted single-quoted, with `''` escaping.
- [ ] Line folding matches libyaml's 80-column default for quoted scalars.
- [ ] `psych.trails.test.ts` pins each case against MRI output.
