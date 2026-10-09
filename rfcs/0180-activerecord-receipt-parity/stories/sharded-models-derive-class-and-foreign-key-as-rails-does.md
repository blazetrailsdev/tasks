---
title: "sharded-models-derive-class-and-foreign-key-as-rails-does"
status: done
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8711
claim: "2026-10-09T15:02:00Z"
assignee: "sharded-models-derive-class-and-foreign-key-as-rails-does"
blocked-by: null
closed-reason: null
---

## Context

trails#8711 made `packages/activerecord/src/test-helpers/models/sharded/*.ts` the single definition of the sharded test models, seated as `Sharded::<Name>`. Their association declarations still carry options Rails does not write.

Rails derives the class and the composite foreign key from the `Sharded` namespace and `query_constraints`:

- `vendor/rails/v8.0.2/activerecord/test/models/sharded/blog_post.rb:8-16` — `belongs_to :blog`, `has_many :comments`, `has_many :blog_post_tags`, `has_many :tags, through: :blog_post_tags`, and `class_name: name` on `parent` / `children`.
- `vendor/rails/v8.0.2/activerecord/test/models/sharded/comment.rb:8-11` — `belongs_to :blog_post`, `belongs_to :blog`.
- `vendor/rails/v8.0.2/activerecord/test/models/sharded/tag.rb` and `blog_post_tag.rb` — bare `has_many :blog_post_tags`, `belongs_to :blog_post`, `belongs_to :tag`.

The trails files pass `className: "Sharded::…"` and `foreignKey: ["blog_id", "blog_post_id"]` on each of these. The module `Sharded` itself is not a seated constant (the classes are seated under their full path), so whether `compute_type` resolves a bare `:blog` from inside `Sharded::BlogPost` is untested.

## Acceptance criteria

- [ ] Each association in `sharded/*.ts` carries exactly the options its Rails declaration does; the class and foreign key are derived.
- [ ] `Sharded` is a seated module constant, or the story records why the full-path seat is the converged shape.
- [ ] The sharded tests in `associations.test.ts`, `associations/eager.test.ts`, `associations/inner-join-association.test.ts` and `associations/has-many-through-associations.test.ts` pass unchanged.
- [ ] `pnpm parity:fixtures:models` stays at diff=0 missing=0.
