---
title: "bcrypt and did-you-mean residual: pins, one bcrypt argument row, two did-you-mean moved extras"
status: done
updated: 2026-10-18
rfc: "0193-small-gem-ports-parity-100"
cluster: small-residuals
packages: [bcrypt, did-you-mean]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9021
claim: "2026-10-18T01:24:43Z"
assignee: "bcrypt-and-did-you-mean-parity-residual"
blocked-by: null
closed-reason: null
---

## Context

- bcrypt pins are 0/13 (none pinned), and did-you-mean pins are 6/8 (`pnpm parity:api:pins`; pin with `body-pins.ts`).
- bcrypt argument row: `password.rb initialize` calls `split_hash(self)`, where TS passes `toString` (`vendor/bcrypt-ruby/v3.1.20/lib/bcrypt/password.rb`).
- did-you-mean extra surface: `index.ts` has 2 moved names, `formatter` / `setFormatter`, in a file with no Rails counterpart; they belong in the file mirroring the `.rb` that defines `DidYouMean.formatter`.

## Acceptance criteria

- [ ] Pins show 0 unpinned for both packages.
- [ ] 0 bcrypt rows in `call-arg-mismatches.json`, and 0 novel / 0 moved in `parity:api:extra --package did-you-mean`.
