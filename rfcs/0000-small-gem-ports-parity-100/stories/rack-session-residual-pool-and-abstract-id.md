---
title: "rack-session residual: Pool#mutex, abstract/id call rows and argument row, two skipped tests"
status: draft
updated: 2026-10-15
rfc: "0000-small-gem-ports-parity-100"
cluster: rack-session
packages: [rack-session]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `pool.rb` is 7/8: `Rack::Session::Pool#mutex` is missing.
- Call rows (baselined in `call-mismatches-exclude/rack-session/abstract/id.json`): `abstract/id.rb initialize` omits `delete`, and `commit_session` has the order `cookieValue,constructor`.
- Argument row (naming): `load_session` calls `find_session(req, currentSid)`, where Rails passes `sid`.
- Tests: `spec_session_pool.rb` and `spec_session_abstract_id.rb` have 1 skip each.

## Acceptance criteria

- [ ] rack-session 98/98 methods once the cookie and encryptor stories land; `pool.rb` 8/8 here.
- [ ] The `abstract/id.json` shard is deleted and tightened, with 0 rack-session rows in either mismatch output.
- [ ] Both skips are ported, or carry a `PERMANENT-SKIP:` line that cites a ratified CLAUDE.md section.
