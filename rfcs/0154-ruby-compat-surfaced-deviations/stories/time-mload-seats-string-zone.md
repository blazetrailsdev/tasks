---
title: "time-mload-seats-string-zone"
status: draft
updated: 2026-10-16
rfc: "0154-ruby-compat-surfaced-deviations"
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

`time_mload` (`vendor/ruby/v3.3.11/time.c:5448`) sets the dumped `zone` ivar through `mload_zone` (`time.c:5432-5442`). When `find_timezone` answers nil, `mload_zone` returns the zone String itself, and that String becomes `tobj->vtm.zone`. So `Marshal.load` of a Time dumped in JST answers `zone == "JST"` with its fixed offset.

trails' `Time._load` (`packages/date/src/time.ts`, trails#8974) keeps the offset but drops a String zone. A fixed-offset `Time` reads its zone from `#zoneObject`, and `#zoneArgument` hands that value back to `#atInstant` as an IANA identifier. Seating an abbreviation such as "JST" there would make `Time.at(time)` / `getlocal` treat it as a zone id.

## Acceptance criteria

- A fixed-offset `Time` can carry a zone-name String (vtm.zone) apart from its zone argument, and `Time._load` seats `mload_zone`'s String answer on it.
- `Marshal.load` of a Time MRI dumped under `TZ=Asia/Tokyo` (`Time.local(2004)`) answers `zone == "JST"` and `utcOffset == 32400`.
- The `@missingRailsCall` receipt on `Time._load` is removed.
