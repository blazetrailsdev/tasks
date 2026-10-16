---
title: "psych-emitter-tracks-libyaml-column-and-flow-state"
status: closed
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: duplicate of psych-emitter-owns-libyaml-scalar-analysis, which stays open with the same acceptance criteria"
---

## Context

`packages/ruby-compat/src/psych/emitter.ts` now ports libyaml's `yaml_emitter_check_simple_key` for scalar keys (a key over 128 bytes is written `? key`), but the column and flow state still come from the npm `yaml` backend:

- Plain-scalar folding runs through the backend's `foldFlowLines`, so an explicit key with spaces folds one word earlier than libyaml: `ruby -ryaml -e 'p YAML.dump({"a b"*50=>{"x"=>1}})'` breaks after the 27th `ba`, trails after the 26th.
- `writeSingleQuoted` still guesses a root scalar's starting column from an empty `ctx.indent` (`"--- ".length`), and still lives in the `customTags` str override.
- Collection keys: libyaml writes an empty `{}`/`[]` key simple; the backend always writes a collection key explicit.

## Acceptance criteria

- [ ] The emitter tracks libyaml's column itself (`yaml_emitter_write_plain` / `write_single_quoted`), and the `customTags` str override is deleted.
- [ ] `psych.trails.test.ts` pins the folded explicit key and an empty-collection key against `ruby -ryaml`.
