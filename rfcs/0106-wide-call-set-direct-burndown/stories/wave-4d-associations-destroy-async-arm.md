---
title: "Port the :destroy_async dependent arm on belongs_to, has_many and has_one"
status: in-progress
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6762
claim: "2026-08-20T09:22:33Z"
assignee: "wave-4c-ar-core-residue-core-find-by"
blocked-by: null
closed-reason: null
---

## Context

Cluster 1 of the `wave-4d-associations-residue-part-4` split (part 4 shipped as
PR 6739 and took only the tractable half of cluster 4). The `:destroy_async`
`dependent:` arm is missing from three association bodies, which is ~17 open
`kind: "set"` rows across three shards. The TS bodies handle `:destroy` and the
generic `target.public_send(options[:dependent])` fallthrough but drop the
`when :destroy_async` branch entirely.

Rails sources (vendored):

- `activerecord/lib/active_record/associations/belongs_to_association.rb:7-38`
  — `handle_dependency`; builds `primary_key_column` from
  `reflection.active_record_primary_key`, `id` from the FK (array-aware:
  `reflection.foreign_key.map { |col| owner.public_send(col) }` for a composite
  FK), resolves `association_class` via `owner.public_send(reflection.foreign_type)`
  when polymorphic else `reflection.klass`, then calls
  `enqueue_destroy_association(owner_model_name:, owner_id:, association_class:,
association_ids: [id], association_primary_key_column:,
ensuring_owner_was_method: options.fetch(:ensuring_owner_was, nil))`.
- `activerecord/lib/active_record/associations/has_many_association.rb:20-56`
  — same shape on the collection side.
- `activerecord/lib/active_record/associations/has_one_association.rb:26-55`
  — the `delete` body's `:destroy_async` arm.

Open rows (from `scripts/api-compare/output/call-mismatches.json`):

    associations/belongs-to-association.json  handle_dependency -> foreign_key, map, klass, id, fetch, enqueue_destroy_association
    associations/has-many-association.json    handle_dependency -> first, id, klass, fetch, enqueue_destroy_association
    associations/has-one-association.json     delete            -> primary_key, id, klass, fetch, enqueue_destroy_association

Note `options.fetch(:ensuring_owner_was, nil)` is a Ruby `fetch`, not `??` — it
returns a stored `nil`/`false` where `??` would substitute the default.

## Acceptance criteria

- [ ] All three bodies carry Rails' `when :destroy_async` branch with Rails'
      control flow, branch order and locals (`primary_key_column`, `id`,
      `association_class`).
- [ ] `enqueue_destroy_association` is called with Rails' exact kwarg set and
      values; `ensuring_owner_was` reads through Ruby `fetch` semantics.
- [ ] The composite-FK arm (`reflection.foreign_key.is_a?(Array)`) is ported,
      not collapsed into the scalar arm.
- [ ] All ~17 rows in the three shards are converged (deleted by hand via
      `serializeBaseline`) or carry a reviewed one-line reason. No reseed, no
      widened allowlist.
- [ ] `pnpm parity:api:calls` / `:args` green; marks tightened per shard.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
