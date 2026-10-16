---
title: "Psych.dump puts an empty root collection on the --- line, as libyaml does"
status: in-progress
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8964
claim: "2026-10-16T00:45:26Z"
assignee: "activerecord-port-legacy-yaml-adapter-and-yaml-column"
blocked-by: null
closed-reason: null
---

## Context

`ruby -ryaml -e 'p YAML.dump({})'` prints `"--- {}\n"`: libyaml emits an empty root mapping as a flow `{}` on the document-start line. In trails, `Psych.dump(new Hash())` (`packages/ruby-compat/src/psych.ts`, YAMLTree → emitter) prints `"---\n{}\n"`. Since trails#8950, a serialized `Hash` column defaults to `new Hash()` (`rbClassNewInstance`), so this form now reaches stored YAML. Ruby's nested case already matches: `YAML.dump({"a"=>{}})` is `"---\na: {}\n"`.

## Acceptance criteria

- [ ] `Psych.dump(new Hash())` and `Psych.dump({})` answer `"--- {}\n"`, as checked against `ruby -ryaml`. Same for an empty Array root (`"--- []\n"`).
- [ ] A `psych.trails.test.ts` case pins both against MRI output.
