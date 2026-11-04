---
title: "Lint rule: a constructor or exported function may not return a Proxy"
status: draft
updated: 2026-11-04
rfc: "0000-no-returned-proxies"
cluster: gate
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails:

- A new rule under `eslint/`, beside `ruby-compat-native-required.mjs`.

Rails / Ruby:

- None: this is a repo rule.

Lands first, enrolled with an only-shrink list of today's sites (this RFC's stories), so no new returned Proxy appears while the burndown runs. Each story deletes its row. The rule flags `return new Proxy(…)` in a constructor, a function or allocator whose returned value is a `new Proxy(…)` expression, and an exported `const` initialised with one; a Proxy passed to `Object.setPrototypeOf` is the sanctioned form and is not flagged.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] A lint rule under `eslint/` reports a returned Proxy in the three shapes
      named above, with a fixture test per shape and one for the sanctioned
      `Object.setPrototypeOf(…, new Proxy(…))` form.
- [ ] Its enrollment is an only-shrink JSON list holding exactly the sites in
      this RFC's other stories, each row naming its story id.
- [ ] CI runs it; a new returned Proxy anywhere in `packages/*/src` reds.
