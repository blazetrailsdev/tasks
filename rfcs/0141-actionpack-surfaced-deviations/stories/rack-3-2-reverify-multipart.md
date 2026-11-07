---
title: "rack-3-2-reverify-multipart"
status: done
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9831
claim: "2026-11-07T14:01:38Z"
assignee: "rack-3-2-reverify-multipart"
blocked-by: null
closed-reason: null
---

## Context

`bump-vendored-rack-anchor-to-3-2` moved the rack anchor to `v3.2.8` and re-pinned these bodies without re-verifying the TS ports. Ruby: `vendor/rack/v3.2.8/lib/rack/multipart/parser.rb` and `multipart/uploaded_file.rb`. TS: `packages/rack/src/multipart/`.

Drifted `Parser` bodies: `self.parse_boundary` (:122), `self.parse` (:141), `initialize` (:258), `parse` (:279), `result` (:303), `read_data` (:316), `handle_fast_forward` (:335), `handle_mime_head` (:377), `handle_mime_body` (:506). New helpers in 3.2: `update_retained_size` (:528) and others next to them. Removed: `dequote` (pin pruned). `UploadedFile` changed too (48 lines in the diff).

## Acceptance criteria

- Each listed method mirrors its v3.2.8 body, with 3.2's new private helpers ported at their Rails names.
- The rack multipart test files from v3.2.8 `test/spec_multipart*.rb` that changed are re-ported.
