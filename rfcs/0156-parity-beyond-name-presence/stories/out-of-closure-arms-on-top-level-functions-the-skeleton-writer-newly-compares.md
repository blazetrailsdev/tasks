---
title: "thor, i18n, rack, actionview, actionpack, trailties: converge or receipt the arm mismatches on top-level functions the skeleton writer newly compares"
status: draft
updated: 2026-10-09
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
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

The skeleton writer (`skeletonsOfOwner`, `scripts/api-compare/compare.ts`) dropped every top-level
`export function` that the extractor's synthesized file module re-lists, so these pairs never reached
`pnpm parity:api:arms:report`. The writer fix (story
`skeleton-writer-drops-top-level-functions-relisted-by-the-synthesized-file-module`) grew
`call-skeletons.json` from 7602 rows to 8120, and the pairs below are the newly compared ones the
report files as mismatched. Each line is `<ts file>#<ts name> (<rb file>#<rb name>): <arm diff>`, where
`-token` is an arm Rails takes and the port omits and `+token` is one the port adds. The Ruby paths are
relative to the gem's `lib/<gem>/` under `vendor/rails/v8.0.2/` (or the vendored gem for thor, rack, i18n, pg).

**thor** (5)

- `actions/file-manipulation.ts#appendToFile (actions/file_manipulation.rb#append_to_file)`: `+if +if`
- `actions/file-manipulation.ts#gsubFile (actions/file_manipulation.rb#gsub_file)`: `+if +if`
- `actions/file-manipulation.ts#injectIntoModule (actions/file_manipulation.rb#inject_into_module)`: `+if +if`
- `actions/file-manipulation.ts#injectIntoClass (actions/file_manipulation.rb#inject_into_class)`: `+if +if`
- `actions/file-manipulation.ts#prependToFile (actions/file_manipulation.rb#prepend_to_file)`: `+if +if`

**actionview** (2)

- `helpers/javascript-helper.ts#javascriptTag (helpers/javascript_helper.rb#javascript_tag)`: `+if +if +if`
- `helpers/javascript-helper.ts#escapeJavascript (helpers/javascript_helper.rb#escape_javascript)`: `+if`

**i18n** (5)

- `i18n.ts#reservedKeysPattern (i18n.rb#reserved_keys_pattern)`: `+if`
- `utils.ts#deepSymbolizeKeys (utils.rb#deep_symbolize_keys)`: `-if`
- `i18n.ts#localize (i18n.rb#localize)`: `+if`
- `utils.ts#deepMergeBang (utils.rb#deep_merge!)`: `+loop +if`
- `i18n.ts#transliterate (i18n.rb#transliterate)`: `+if +if`

**rack** (3)

- `media-type.ts#type (media_type.rb#type)`: `-if`
- `media-type.ts#stripDoublequotes (media_type.rb#strip_doublequotes)`: `-if`
- `mime.ts#mimeType (mime.rb#mime_type)`: `+if`

**trailties** (3)

- `command/actions.ts#requireApplicationBang (command/actions.rb#require_application!)`: `+throw +if`
- `command.ts#invoke (command.rb#invoke)`: `-try -rescue -if`
- `generators/testing/assertions.ts#assertFile (generators/testing/assertions.rb#assert_file)`: `+if`

**abstractcontroller** (1)

- `deprecator.ts#deprecator (deprecator.rb#deprecator)`: `+if`

**actiondispatch** (1)

- `deprecator.ts#deprecator (deprecator.rb#deprecator)`: `+if`

Re-derive the current list with `pnpm tsx scripts/api-compare/report-arms.ts --sample=100000`.

## Acceptance criteria

- [ ] Each pair is converged onto Rails' control flow, or its invented arm carries an
      `@inventedArm <token> — PERMANENT|CONVERGEABLE <story-id>` receipt on the declaration.
- [ ] A row that is a comparer artefact (a mispairing, an idiom fold) is fixed in the comparer, not receipted.
- [ ] `pnpm parity:api:arms:throws` stays green without raising a mark.
