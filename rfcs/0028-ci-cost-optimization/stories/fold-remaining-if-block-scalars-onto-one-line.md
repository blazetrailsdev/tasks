---
title: "Fold the remaining if: block scalars so expressions carry no literal newlines"
status: done
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 6185
claim: "2026-08-07T17:29:47Z"
assignee: "activerecord-unrouted-privates-tasks-and-migration"
blocked-by: null
closed-reason: null
---

## Context

Under YAML's folded-scalar rules (spec 8.1.3) a continuation line indented MORE
than the block scalar's established indentation is "more indented" and keeps its
literal newline instead of folding to a space. Several `if: >-` blocks in
`.github/workflows/ci.yml` align continuation lines under an opening paren, so
the parsed expression contains embedded `\n`.

GitHub Actions' expression grammar treats newlines as whitespace, so the runtime
effect today is nil — this is latent fragility and byte-inconsistency with the
file's own convention, not a live bug.

PR #5749 fixed `postgres-tests` and `maria-tests`. Re-measured 2026-08-07 on
origin/main (311bff350) with the reproducer below — the affected set has GROWN
since this was filed, so work from this list, not the original one
(job -> embedded newline count):

- `guides-typecheck`: 1
- `virtualized-dx-type-tests`: 1
- `leaf-tests`: 4 (job-level `if:` and its "DX type tests" step)
- `sqlite-mem-tests`: 1
- `trails-tsc-tests`: 1
- `maria-prepared-tests`: 3
- `website`: 1

`guides-typecheck` and `maria-prepared-tests` are new since the story was
written.

Reproduce:

```sh
python3 -c "import yaml;d=yaml.safe_load(open('.github/workflows/ci.yml'));\
print({k: v['if'].count(chr(10)) for k, v in d['jobs'].items() \
  if isinstance(v.get('if'), str) and chr(10) in v['if']})"
```

## Acceptance criteria

- [ ] Continuation lines in the listed `if:` blocks sit at the block scalar's
      base indentation, so each parsed `if` is a single line.
- [ ] Whitespace-only change — no gate logic altered (verify with a parsed-value
      before/after comparison, not just a visual diff).
- [ ] Consider a test asserting no job `if:` contains a newline, to stop this
      recurring.
