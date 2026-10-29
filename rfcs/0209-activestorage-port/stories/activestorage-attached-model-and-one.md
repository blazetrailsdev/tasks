---
title: "Port Attached::Model#has_one_attached, Attached::One and the single-attachment changes"
status: ready
updated: 2026-10-29
rfc: "0209-activestorage-port"
cluster: as-attached
packages: ["activestorage"]
deps: ["activestorage-attachment-model"]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/attached/model.rb` (299): `has_one_attached`
(`:108-150`) defines the reader and writer through
`generated_association_methods.class_eval` (`:111-126`), the `has_one`s,
`with_attached_*`, `after_save` / `after_commit` (`:142-144`) and the
reflection; `attachment_changes` (`:281`), `changed_for_autosave?`,
`initialize_dup`, `reload`. `attached.rb` (27), `attached/one.rb` (86,
`delegate_missing_to :attachment, allow_nil: true` at `:27`, `attach` `:58`),
`attached/changes.rb` and `changes/{create_one,delete_one,detach_one,purge_one}.rb`
(~190).

## Acceptance criteria

- `hasOneAttached` defines the reader as a property and the writer as an
  async `set<Name>` method on the generated-association module, with no
  string eval and no `=` setter (RFC "Attaching", Decisions).
- Assigning an attachment key through `setAttributes` awaits the writer; the
  constructor and `assignAttributes` raise for one.
- The writer awaits `CreateOne`'s unfurl of the attachable, so the blob is
  built when it resolves, and the `upload` runs in the async `after_commit`.
- `One#attach`, `detach`, `purge`, `purge_later` are async; `One`'s
  `delegate_missing_to` is a Proxy row in CLAUDE.md's table.
- The `One` tests are the `activestorage-attached-one-test` story.
