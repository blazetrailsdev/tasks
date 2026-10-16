---
title: "Psych emitter writes an empty-collection or alias key simple, as libyaml does"
status: done
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8974
claim: "2026-10-16T13:14:55Z"
assignee: "messages-marshal-with-fallback-uses-real-marshal"
blocked-by: null
closed-reason: null
---

## Context

libyaml's `yaml_emitter_check_simple_key` (emitter.c) treats an empty sequence or mapping key (`check_empty_sequence` / `check_empty_mapping`) and an alias key as simple, so `ruby -ryaml -e 'p YAML.dump({{}=>1})'` writes `{}: 1`. trails' `Psych::Emitter#checkSimpleKey` (`packages/ruby-compat/src/psych/emitter.ts`, trails#8964) answers the same, but `add` only consults it for scalar keys: the npm `yaml` backend's `stringifyPair` makes every collection and alias key explicit (`? {}`), whatever the check says.

## Acceptance criteria

- [ ] An empty-collection key and an alias key are written simple, as `ruby -ryaml` does, with `checkSimpleKey` deciding for every key kind in `add`.
- [ ] `psych.trails.test.ts` pins `Psych.dump` of a `{}` key and an alias key against MRI output.
