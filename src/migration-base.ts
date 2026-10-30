import { Migration } from "@blazetrails/activerecord";

// The versioned base every migration extends. The pin spells it
// `Migration.forVersion(8)`; current trails spells it `Migration.get(8)`, and
// `get` on the pin returns null. Both are honoured so `track-trails.sh` can
// smoke a candidate from this checkout. The first real bump replaces this with
// `Migration.get(8)` at each migration.
const spellings = Migration as unknown as {
  forVersion?: (version: number) => typeof Migration;
  get: (version: number) => typeof Migration;
};

export const Migration8 = spellings.forVersion?.(8) ?? spellings.get(8);
