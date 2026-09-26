# Story 007: 오프닝 5장 — 간판 교체 + 타이틀 드롭

> **Epic**: shop-growth (영업 화면 — 가게 단면)
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 컷씬 1장면 — 오프닝 시스템 재사용

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — Story §오프닝 5장 ⑤ 간판 교체 (2026-09-26)
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Story §오프닝 5장), scoped to this story:*

- [ ] 오프닝 4장(앞치마) 다음에 5장이 이어진다: 가게 정면 아침 → 갈색 "마라판다" 간판을 내림 → 판다 사장님 "간판은 바꿔도 돼. 맛은 그대로잖아." → 천 덮인 새 간판 → 천이 벗겨지고 핑크 "마라부자" 네온 점등
- [ ] 점등 직후 제목 로고 "마라부자"가 떠오르는 타이틀 드롭이 나오고, 다음 클릭에 첫 영업으로 간다
- [ ] 건너뛰기로 바로 첫 영업으로 갈 수 있다
- [ ] 이미 오프닝을 본 기존 세이브는 다음 접속 때 5장만 한 번 보고, 이후엔 다시 보지 않는다 (`signSwapSeen` 저장)
- [x] 이후 영업 단면의 간판은 "마라부자"다, 오프닝 1–4장은 "마라판다" 그대로 — 2026-09-27 먼저 반영: 영업 배경 7장(0–6단계) 모두 새 간판 (`scene_shop.py --all`, 옛 간판은 `--old-sign`)
- [ ] 움직임 줄이기(`prefers-reduced-motion`)면 천·네온·로고가 애니메이션 없이 바로 바뀐다

---

## Implementation Notes

- `OPENING_SCENES`에 5장 추가 (`enter`/`leave`/`bgAt`, 자막 재사용).
- 배경: 1장 가게 정면(`tools/art/scene_office.py`)의 아침판 + 간판 두 벌(갈색·천 덮음·핑크 네온).
- 타이틀 로고는 타이틀 화면의 `.title-logo`를 재사용.
- 시안: `design/art/interior-mockups/stage-0.png` (갈색 가게 + 핑크 간판).

---

## Out of Scope

- Story 005: 인테리어 단계
- economy E004: 엔딩(권리금 완납, 옛 간판 액자)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Visual/Feel
**Required evidence**: `production/qa/evidence/sign-swap-opening/` 스크린샷(간판 내림·점등·타이틀) + 기존 세이브에서 한 번만 나오는지 확인
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
