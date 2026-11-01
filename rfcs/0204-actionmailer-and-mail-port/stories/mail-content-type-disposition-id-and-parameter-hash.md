---
title: "mail-content-type-disposition-id-and-parameter-hash"
status: draft
updated: 2026-11-01
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`mail-remaining-header-fields` shipped comments, content-description, content-location, content-transfer-encoding, in-reply-to, keywords, mime-version, received and references with their specs, and stopped at the PR ceiling. Left:

- `vendor/mail/2.8.1/lib/mail/indifferent_hash.rb`: `IndifferentHash < Hash`, in `packages/mail/src/indifferent-hash.ts`, over ruby-compat `Hash` (see `packages/activesupport/src/hash-with-indifferent-access.ts`).
- `vendor/mail/2.8.1/lib/mail/fields/parameter_hash.rb`: `[]` is an override of `get`. Ruby's `^`/`$` need the `m` flag, and the two `sort`s compare by code unit, not `localeCompare`.
- `lib/mail/fields/content_id_field.rb`, `content_disposition_field.rb`, `content_type_field.rb`.
- `spec/mail/fields/{parameter_hash,content_id_field,content_disposition_field,content_type_field}_spec.rb`, and whatever of `message_id_field_spec.rb` is still unported.

Notes from the first attempt:

- `ensure_filename_quoted` is called before `super`: spell it `new.target.prototype.ensureFilenameQuoted(value)`, the shape of `Field.ParseError` in `packages/mail/src/field.ts`. Subclass memos are `declare protected`, because a field declaration would run after `super()` and overwrite them.
- `ContentTypeField#initialize` seats `@main_type`, `@sub_type` and `@parameters` before `super`, and `CommonField`'s constructor reads them through `value` (`content_type_field.rb:27-38`, `:83-89`). The Array arm has to pass `null` to `super`, seat them, then assign `this.value`, under `@inventedArm if — PERMANENT`.
- The `value` override needs both accessors: `set value(v) { super.value = v; }`.
- `ContentTypeField#method_missing` (`content_type_field.rb:112-119`) is what `c.filename = string` reaches (`content_type_field_spec.rb:659`). Port it as a named `methodMissing`, no trap, and add its row to CLAUDE.md § "Ruby protocol methods with a different JS mechanism".
- `sanitize`'s `i.split(/\s*\=\s*/, 2)` keeps the remainder (`content_type_field.rb:161`); JS `split` with a limit drops it.

## Acceptance criteria

- The classes above are ported at their Ruby names and exported from `packages/mail/src/index.ts`.
- Those specs pass under their verbatim names.
- `pnpm parity:api:calls`, `parity:api:calls:args` and `parity:api:extra:gate` stay green, and `pnpm parity:class-paths` is re-run.
