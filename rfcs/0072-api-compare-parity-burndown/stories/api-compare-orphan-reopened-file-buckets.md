---
title: "api-compare-orphan-reopened-file-buckets"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6131
claim: "2026-08-05T15:41:05Z"
assignee: "row-write-ratchet-misses-implicit-model-level-writes"
blocked-by: null
closed-reason: null
---

## Context

parity:api buckets a Ruby class/module's whole method set under the ONE file
the extractor stamped on the entity — the file that defined its FIRST method
(`maybe_update_module_file`, `scripts/api-compare/extract-ruby-api.rb:670`).
Ruby reopens classes across many files, so every method a LATER file adds is
measured against the DEFINING file's TS counterpart and reports missing forever,
no matter what is ported. The reopening file never gets a row in the summary at
all.

`inflector-methods-rb-unmapped-in-file-manifest` fixed two of these
(`inflector/methods.rb`, `core_ext/string/inflections.rb`) by introducing
`RUBY_FILE_TS_OVERRIDES` in `scripts/api-compare/conventions.ts` plus
`splitOverriddenFileBuckets` in `compare.ts`: a Ruby file with an explicit TS
mapping owns its own bucket. **73 orphan files remain.** Enumerate them from
`scripts/api-compare/output/rails-api.json` — a file that appears as a
`MethodInfo.file` but is no entity's `ClassInfo.file`:

```python
import json
d = json.load(open("scripts/api-compare/output/rails-api.json"))
for pkgname, pk in d["packages"].items():
    ents = list(pk.get("classes", {}).items()) + list(pk.get("modules", {}).items())
    homes = {i["file"] for _, i in ents if i.get("file")}
    orphan = {}
    for _, i in ents:
        for m in i.get("instanceMethods", []) + i.get("classMethods", []):
            f = m.get("file")
            if f and f != i.get("file") and f not in homes:
                orphan[f] = orphan.get(f, 0) + 1
    for f, c in sorted(orphan.items(), key=lambda x: -x[1]):
        print(pkgname, c, f)
```

Current top of the list (method count, file):

- activesupport (65 files, 362 methods): `core_ext/time/calculations.rb` 57,
  `core_ext/date_time/calculations.rb` 38, `core_ext/date/calculations.rb` 34,
  `core_ext/hash/keys.rb` 15, `core_ext/date_time/conversions.rb` 13,
  `core_ext/numeric/time.rb` 13, …
- globalid: `global_id.rb` 22
- activerecord: `encryption/cipher.rb` 6, `version.rb` 1
- activemodel: `validations/validates.rb` 4, `validations/helper_methods.rb` 1,
  `version.rb` 1
- activerecord-test-support: `connection.rb` 3
- actionview / trailties / actionpackversion: `version.rb` 1 each

Note the `tsFile: null` signature quoted in the original story is a red
herring: `FileResult` has no `tsFile` field at all (it carries
`expectedTsFile`), so `f.get("tsFile") is None` is true for every bucket
including 100%-ported ones. The real signature is the orphan-file query above.

## Acceptance criteria

- Each orphan file either gets a `RUBY_FILE_TS_OVERRIDES` entry naming its TS
  counterpart, or is documented as genuinely unported (and, where the whole
  file is out of scope, added to `UNPORTED_FILES` with a reason).
- The activesupport `core_ext/{time,date,date_time}/calculations.rb` cluster
  (129 methods) is the largest single win and can be its own PR.
- Ported-method deltas are reported per package in the PR body — these are
  measurement fixes, so jumps are expected and must be called out, not
  presented as new porting work.
- Newly matched pairs that surface wide call-mismatch entries get real reasons
  (or a follow-up story), never the seeded default.
- Split across PRs under the 500 LOC ceiling; do not fan out sibling PRs from
  one agent — register each slice as its own story.
