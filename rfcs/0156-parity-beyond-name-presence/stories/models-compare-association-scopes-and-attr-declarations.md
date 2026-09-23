---
title: "Extend parity:fixtures:models to association scope lambdas and attr_* declarations"
status: done
updated: 2026-09-22
rfc: "0156-parity-beyond-name-presence"
cluster: "comparers"
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#7987
claim: "2026-09-22T23:01:15Z"
assignee: "models-compare-association-scopes-and-attr-declarations"
blocked-by: null
closed-reason: null
---

## Context

Three 0155 stories are drift between a Rails test model and its trails mirror, found only because a converged test failed:

- `topic-open-replies-scope`: `has_many :open_replies, -> { open }, ...` (`vendor/rails/activerecord/test/models/topic.rb:51`) is mirrored without the scope (`packages/activerecord/src/test-helpers/models/topic.ts:127`), so it returns every reply.
- `visitor-model-drops-password-confirmation-reader`: `attr_reader :password_confirmation` (`vendor/rails/activemodel/test/models/visitor.rb:12`) omitted.
- `client-destroyed-client-ids-hash-default`: a `Hash.new { |h, k| h[k] = [] }` class-level memo mirrored as a bare `Map`.

`scripts/fixtures-compare/extract-ruby-models.rb:100` records each association's kind, name and options, from one source line. It does not record whether a scope lambda is present, and it records no `attr_*`.

## Acceptance criteria

- The Ruby model extractor records `hasScope` per association and the `attr_reader` / `attr_writer` / `attr_accessor` names per class.
- `parity:fixtures:models` reports an association whose Rails side has a scope and whose trails side has none, and a missing attr declaration.
- The first two stories above appear. The third is out of reach of this check and the PR says so.
- The activemodel test models directory is covered as well as activerecord's, or a follow-up story is filed for it.
- Report-only unless the first run is clean enough to seed a mark, which the PR body decides.
