---
title: "Nokogiri::HTML5 singleton methods live in an html5.ts mirroring html5.rb"
status: draft
updated: 2026-11-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["nokogiri"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Nokogiri::HTML5`'s singleton methods (`parse`, `fragment`, `read_and_encode`, `vendor/nokogiri/v1.18.3/lib/nokogiri/html5.rb:272-306`) have no mirroring `packages/nokogiri/lib/html5.ts`. `parity:api` scores `html5.rb` → `html5.ts` at 0/5. trails#10720 seats `HTML5.readAndEncode` in `packages/nokogiri/lib/namespaces.ts`, because a separate `html5.ts` on the boot import path raised `scripts/boot-graph/baseline.json` (nokogiri 33 → 34).

## Acceptance criteria

- `packages/nokogiri/lib/html5.ts` mirrors `html5.rb`: `HTML5.parse`, `HTML5.fragment` and `HTML5.readAndEncode` are defined there and seated on the `HTML5` namespace.
- It loads without raising nokogiri's boot-graph count, for example by having `namespaces.ts`'s existing module host the seat while the definitions live in `html5.ts`.
- `parity:api` credits `read_and_encode` (and `parse` / `fragment`) to `html5.rb`.
