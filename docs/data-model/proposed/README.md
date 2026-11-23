# Remaining proposals — not implemented

Updated 23 November 2026. Shared organisation affiliations and school/club directory mapping are now implemented. See the [current model](../README.md) and [feature notes](../../organisation-affiliations.md). This page contains outstanding design work only.

## Organisation confirmation and public visibility

Build an explicit organisation review workflow with carefully scoped authority. A self-reported affiliation must not become confirmed just because someone owns a demo school account. Decide how genuine organisation representatives are verified before enabling confirmation or rejection.

Add explicit consent and visibility rules before public counts. Count distinct eligible people per organisation and role, excluding requested/rejected/ended affiliations. Preserve historical dates and decide whether small groups need suppressed counts to protect children. A child with two guardians must count as one athlete. Public member lists must not be inferred from an aggregate feature.

Partnership highlighting remains independently approved. Directory inclusion, affiliation, access permissions and commercial partnership are separate concepts.

## Extend canonical organisation links

- Map universities to organisations when their affiliation flow is designed. The first release imports schools and clubs only.
- Consider an optional organisation association for coach teams, requiring organisation authorisation before presenting a team as official.
- Decide whether coach fixtures and imported school fixtures need a source mapping or a shared canonical fixture. Preserve evidence and never deduplicate by team name alone.
- If tournaments need shared identities, introduce competition and season records instead of text labels.

## Integrity and consolidation

Audit records before adding constraints or merging structures. The schema snapshot is not a data-quality audit.

- Consider unique user links for athlete, guardian and scout profiles where one profile per account is intended. Review duplicates and references first.
- Enforce cross-record consistency for player/account team mappings, attendance player/event teams, and resource asset ownership and purpose.
- Review nullable ownership fields and ID-shaped columns without foreign keys; establish their intended targets first.
- Review the managed-child unique index, which includes revoked links, before supporting reassignment.
- Inventory usage of the athlete-sport structures and older verification paths before consolidating records and callers.
- Consider explicit links between scheduled sessions, logged training and attendance. Define deduplication and verification rules before combining totals.

The [future organisation workflow diagram](organisation-affiliations.svg) labels existing structures separately from unimplemented workflows. It is conceptual, not an additional migration.
