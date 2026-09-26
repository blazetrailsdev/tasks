---
title: "Model.find_by_<attr> is unreachable on the model class until a relation call defines it"
status: done
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8113
claim: "2026-09-25T21:47:29Z"
assignee: "activemodel-error-message-nil-raw-type-cast-to-string"
blocked-by: null
closed-reason: null
---

## Context

Rails' `DynamicMatchers#method_missing` (`vendor/rails/activerecord/lib/active_record/dynamic_matchers.rb:15-24`) runs on the model class, so `Topic.find_by_title("x")` works directly, and `finder_test.rb` and friends call it that way.

trails#8083 ported `method_missing` / `Method#define` (`packages/activerecord/src/dynamic-matchers.ts`, wired as `Base.methodMissing`). A model class is not a Proxy, though, so the only caller of `methodMissing` is `ClassSpecificRelation#methodMissing` (`relation/delegation.ts`) behind the relation Proxy. `Topic.findByTitle("x")` is a `TypeError` until some relation call has run `Method#define` for that name. Tests port it as `Topic.findBy({ title: "x" })` or `(Topic.all() as any).findByTitle(...)`.

## Converged shape

A model-class dispatch that reaches `DynamicMatchers#method_missing` for an unbound `findBy…` name, the class-level analogue of the relation Proxy. This needs a per-class decision in CLAUDE.md § "Ruby protocol methods with a different JS mechanism". Measure the cost of a Proxy returned in place of the class (or a static-side Proxy prototype) against the record numbers in § "Records are not Proxies", which covers instances only.

## Acceptance criteria

- `Topic.findByTitle("The First Topic")` resolves with no prior relation call.
- The ports that currently spell `Model.findBy({...})` for a Rails `Model.find_by_x(...)` call the dynamic finder.
- The CLAUDE.md dispatch-table row for `active_record/dynamic_matchers.rb` records the decision.
