---
title: "ruby-compat: StringScanner#scan slices the remaining string on every call"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced reviewing trails#8486. `StringScanner#scan` (`packages/ruby-compat/src/string-scanner.ts`) now
matches over `this.#str.slice(this.#curr)` so that `^` and `\A` anchor at the scan pointer, as
`strscan_do_scan` does (`vendor/ruby/v3.3.11/ext/strscan/strscan.c:605`). The slice is O(n) per call, so
scanning a long string token by token is O(n^2). MRI matches in place by handing the regex engine the
pointer as the string start.

Callers: `packages/activerecord/src/connection-adapters/postgresql/oid/hstore.ts#deserialize` and
`packages/actionpack/src/action-dispatch/journey/gtg/simulator.ts`.

## Acceptance criteria

- [ ] `scan` matches at the pointer without copying the rest of the string, while `^` still anchors there
      (e.g. a sticky match for patterns with no `^` / `\A`, and the slice only for anchored ones).
- [ ] The existing `string-scanner.trails.test.ts` cases pass, including "scan anchors ^ at the scan pointer".
