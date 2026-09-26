# Story 001: 가게 단면 배치 — 문·식탁·주방 한 장면

> **Epic**: shop-growth (영업 화면 — 가게 단면)
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26
> **Performance**: 정적 도트 배경 + 기존 DOM 요소 재배치 — 매 프레임 다시 그리는 것 없음

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief — 영업 화면 — 가게 단면 §가게 단면
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (영업 화면 — 가게 단면 §가게 단면), scoped to this story:*

- [ ] 영업 화면 가운데에 옆에서 본 마라판다 가게 단면이 보인다: 뒷벽(간판·등롱·메뉴판·창), 왼쪽 문, 식탁·의자, 오른쪽 끝 주방(가스불·후드·냄비)
- [ ] 식탁은 현재 테이블 수(업그레이드 반영)만큼 번호 꽂이와 함께 바닥 위에 놓이고, 손님이 앉아 있으면 그 의자에 보인다 (이동 연출은 Story 002)
- [ ] 기존 테이블·냄비 조작이 단면 위에서 그대로 동작한다: 냄비 집기, 같은 번호 식탁 서빙, 주문표 → 냄비(클릭·C키), P 일시정지
- [ ] 준비중/영업중 표시가 벽에 있고 영업 중엔 "영업중"이다
- [ ] 단면은 고정 비율 무대라 화면 폭이 바뀌어도 잘리거나 틀어지지 않고, 식탁·주방의 클릭 영역이 겹치지 않는다
- [ ] 좁은 화면(≤700px)의 배치 규칙을 이 스토리에서 확정한다 (예: 식탁 줄바꿈 또는 단면 축소) — 모든 식탁과 냄비를 누를 수 있다
- [ ] 배경 이미지가 없어도 조작은 막히지 않는다

---

## Implementation Notes

- 이전 작업 재사용: `tools/art/scene_shop.py`(벽지·벽널·타일, 이음새 없는 바닥 타일)를 단면의 바탕층으로. 소품(문·식탁·주방·등롱·메뉴판·간판)은 별도 층/요소로 — 인테리어 단계(Story 005)에서 층별로 갈아끼우기 쉽게.
- 무대 좌표는 오프닝의 `STAGE`/`castSpot`처럼 무대 px로 정의하고 %로 배치 — 식탁 자리(`TABLE_SPOTS`)는 테이블 수에 따라 균등 배치하는 순수 함수.
- 이전 증거 `production/qa/evidence/shop-stage-bg-evidence.md`는 바탕층(패널 뒤 배경)만 다룸 — 이 스토리의 증거로 새로 남길 것.
- `.ss .hall`/`.ss .pots` 반투명 패널 방식(이전 작업)은 단면 방식으로 대체된다.

---

## Out of Scope

- Story 002: 손님이 걸어 들어오고 나가는 이동
- Story 003: 그릇 비행·식사 연출
- Story 004–007: 시간대·인테리어·점심 러시·간판 컷씬

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Visual/Feel
**Required evidence**: `production/qa/evidence/shop-cross-section/` 데스크톱·태블릿·모바일 스크린샷 + 조작 확인 메모
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, 004, 005
