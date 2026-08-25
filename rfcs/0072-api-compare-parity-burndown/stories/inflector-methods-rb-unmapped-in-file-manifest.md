---
title: "Map inflector/methods.rb and core_ext/string/inflections.rb so ported inflector methods stop reporting missing"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5952
claim: "2026-08-03T02:35:45Z"
assignee: "inflector-methods-rb-unmapped-in-file-manifest"
blocked-by: null
closed-reason: null
---

## Context

`inflector/methods.rb` and `core_ext/string/inflections.rb` have **no entry**
in parity:api's Rails file-structure manifest. Their methods are folded into
the `inflector/inflections.rb` and `core_ext/object/blank.rb` buckets, whose
`tsFile` is `null` — so every method they define is reported in
`missingMethods` permanently, no matter what
`packages/activesupport/src/inflector.ts` actually ports.

The tell is `deconstantize`: trails has shipped it for ages
(`packages/activesupport/src/inflector.ts:160`) and it is still listed as
missing. PR #5471 added `constantize` / `safeConstantize` and they landed in
the same dead bucket alongside it.

Reproduce:

```sh
python3 -c "
import json
d=json.load(open('scripts/api-compare/output/api-comparison.json'))
for r in d['results']:
  for f in r.get('files',[]):
    n=[m['rubyName'] for m in f.get('missingMethods',[])]
    if 'deconstantize' in n: print(r['package'], f['rubyFile'], f['tsFile'])
"
```

prints `activesupport inflector/inflections.rb None` and
`activesupport core_ext/object/blank.rb None`.

Rails source:

- `vendor/rails/activesupport/lib/active_support/inflector/methods.rb` — the
  `ActiveSupport::Inflector` module methods (`camelize`, `underscore`,
  `constantize`, `safe_constantize`, `deconstantize`, `demodulize`,
  `foreign_key`, `ordinal`, …), 15+ of which trails has ported.
- `vendor/rails/activesupport/lib/active_support/core_ext/string/inflections.rb`
  — the `String#` delegators for the same set.

Both map onto `packages/activesupport/src/inflector.ts` (and the
`core-ext/string-ext.test.ts` side for the delegators).

## Acceptance criteria

- `inflector/methods.rb` maps to `packages/activesupport/src/inflector.ts` in
  the file-structure manifest, and `core_ext/string/inflections.rb` maps to
  its TS counterpart.
- `deconstantize`, `constantize`, `safe_constantize` and the rest of the
  already-ported inflector surface stop appearing in `missingMethods`.
- activesupport's ported-method count moves up by the already-ported methods
  the gap was hiding; the delta is reported in the PR body (this is a
  measurement fix, so the jump is expected and should be called out, not
  presented as new porting work).
- Check whether the same `tsFile: null` folding hides other Rails files —
  a bucket with a null `tsFile` and a non-empty `missingMethods` is the
  signature. Report the count; fix only the inflector pair here if the list
  is long, and register the rest.
