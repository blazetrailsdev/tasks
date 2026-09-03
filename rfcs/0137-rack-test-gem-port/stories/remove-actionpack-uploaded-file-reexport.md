---
title: "Remove the callerless action-dispatch/uploaded-file.ts re-export"
status: draft
updated: 2026-09-03
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/uploaded-file.ts` is a single line:

```ts
export { UploadedFile, type UploadedFileOptions } from "./http/upload.js";
```

There is no `vendor/rails/actionpack/lib/action_dispatch/uploaded_file.rb` —
the class lives at `action_dispatch/http/upload.rb`, which trails already ports
at `action-dispatch/http/upload.ts`. So this file is a TS path with no Rails
counterpart, and its only consumer is
`packages/actionpack/src/action-dispatch/dispatch/uploaded-file.test.ts:2`,
which imports `../uploaded-file.js` while mirroring
`vendor/rails/actionpack/test/dispatch/uploaded_file_test.rb`.

Surfaced while scoping the rack-test gem port (RFC 0137-rack-test-gem-port),
which had to establish which actionpack members are rack-test stand-ins and
which are genuine `ActionDispatch` members. This one is neither — it predates
that work and is unrelated to rack-test — so it is filed rather than folded in.

## Acceptance criteria

- [ ] `packages/actionpack/src/action-dispatch/uploaded-file.ts` is deleted.
- [ ] `dispatch/uploaded-file.test.ts` imports from `../http/upload.js`; its test
      names are unchanged and `parity:test` still credits it against
      `test/dispatch/uploaded_file_test.rb`.
- [ ] `parity:api:extra --package actionpack` novel count drops or holds; deltas
      non-negative.
