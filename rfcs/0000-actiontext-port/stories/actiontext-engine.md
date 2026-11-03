---
title: "Port ActionText::Engine and load it from trailties/all"
status: draft
updated: 2026-11-03
rfc: "0000-actiontext-port"
cluster: at-engine
packages: ["actiontext", "trailties"]
deps: ["actiontext-encryption", "actiontext-tag-helper-and-form-builder", "activestorage-engine"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actiontext/lib/action_text/engine.rb` (94): `isolate_namespace`, `eager_load_namespaces`,
`config.action_text` with `attachment_tag_name` (`:17-18`),
`autoload_once_paths`, and eight initializers:

- `action_text.deprecator` (`:24-26`), which unblocks
  `configuration-test-framework-deprecators` (RFC 0123).
- `action_text.attribute` (`:28-33`): `include Attribute`, `prepend
Encryption` on `:active_record`.
- `action_text.asset` (`:35-39`): the guarded precompile list.
- `action_text.attachable` (`:41-57`): includes `Attachable` into
  `ActiveStorage::Blob` and defines `previewable_attachable?`,
  `attachable_plain_text_representation`,
  `to_trix_content_attachment_partial_path` there.
- `action_text.helper` / `action_text.renderer` (`:59-75`): `helper
Engine.helpers` and `around_action` calling `Content.with_renderer` on
  `:action_controller_base` and `:action_mailer`.
- `action_text.system_test_helper` (`:77-82`), `action_text.configure`
  (`:84-86`), and the `after_initialize` sanitizer-vendor swap (`:88-92`).

`packages/trailties/src/all.ts` lists `"action_text/engine"` with no
`loadPath` entry; `trailties-all-loads-activestorage-engine` (RFC 0209) is the
precedent. RFC 0212's out-of-scope note on ActionText's railties pieces is
picked up here.

## Acceptance criteria

- `packages/actiontext/src/engine.ts` ports every initializer in order with
  Rails' names and `before:` option.
- The `active_storage_blob` block's three methods are defined on `Blob`
  before any includer reads them (CLAUDE.md § "A Ruby module is a JS object
  or a JS class"); no carrier.
- `all.ts` gains the `action_text/engine` load path; an app importing only
  `@blazetrails/trailties/all` boots ActionText (covered in
  `all.trails.test.ts`).
- `app.deprecators.action_text` is seated and the RFC 0123 story is moved
  out of blocked.
