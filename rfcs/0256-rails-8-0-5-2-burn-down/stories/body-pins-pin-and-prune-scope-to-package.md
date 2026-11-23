---
title: "body-pins --pin/--prune scope to one package"
status: draft
updated: 2026-11-23
rfc: "0256-rails-8-0-5-2-burn-down"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/body-pins.ts --pin <ruby-file>` selects records by `r.rubyFile === select.rubyFile` (`pinPairs`), and `rubyFile` is package-relative. So `--pin base.rb` re-pins every package's `base.rb` and clears their bump-ledger rows via `clearLedgerRows`. In trails#10669 it cleared two actioncontroller rows (`_normalize_options`, `_set_vary_header`) that another burn-down story owns. `--prune` is also global: it dropped stale pins and ledger rows for actiondispatch, actionview and trailties. A per-package burn-down story cannot use either command without restoring other packages' rows by hand. The story template's `--pin base.rb` instruction leads straight into this.

## Acceptance criteria

- [ ] `--pin` accepts `--package <pkg>` (or `<pkg>/<file>`) and refuses a bare file name that matches more than one package, listing the matches.
- [ ] `--prune` accepts `--package <pkg>` to limit pruning and ledger clearing to that package.
- [ ] `generate-stories.ts` emits the package-scoped command in each story's acceptance criteria.
- [ ] Unit test in `scripts/api-compare/` covering an ambiguous `base.rb`.
