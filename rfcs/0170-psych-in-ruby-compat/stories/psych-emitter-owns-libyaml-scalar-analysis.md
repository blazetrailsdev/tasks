---
title: "libyaml scalar analysis (simple keys, flow, column) moves into the ported Psych emitter"
status: claimed
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-16T03:44:51Z"
assignee: "psych-emitter-owns-libyaml-scalar-analysis"
blocked-by: null
closed-reason: null
---

## Context

trails#8946 added `analyzeScalar` / `writeSingleQuoted` to `packages/ruby-compat/src/psych/visitors/yaml-tree.ts`. They port libyaml's `yaml_emitter_analyze_scalar` / `yaml_emitter_write_single_quoted` (driven by `vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb:254-301`), but only for block context:

- No flow_plain / simple-key analysis. libyaml writes a key that is longer than 128 characters or spans lines as an explicit `? key` (`yaml_emitter_check_simple_key`). trails leaves that to the backend.
- The starting column of a root scalar is hard-coded as `"--- ".length`, guessed from an empty `ctx.indent`, because the backend does not report the column.

## Acceptance criteria

- [ ] Once `psych-yaml-tree-answers-a-node-tree-emitted-by-node-yaml` gives Psych a ported `Visitors::Emitter`, move the scalar analysis there, with libyaml's full flow, simple-key and column state, and delete the `customTags` str override.
- [ ] `psych.trails.test.ts` pins a key of 129 characters and a multi-line key against `ruby -ryaml` output.
