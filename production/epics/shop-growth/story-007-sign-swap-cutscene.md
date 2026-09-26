# Story 007: 간판 교체 컷씬 "마라부자"

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
**Requirement**: Brief — 영업 화면 — 가게 단면 §인테리어 4단계 — 간판 교체
**ADR Governing Implementation / ADR Decision Summary / ADR Version**: N/A (minimal — no ADRs)
**Engine**: Web (vanilla HTML/CSS/JS, no `engine.name` in `project.yaml`) | **Risk**: NOT ASSESSED (no VERSION.md risk rating — no game engine)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)
**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (영업 화면 — 가게 단면 §인테리어 4단계 — 간판 교체), scoped to this story:*

- [ ] 인테리어 4단계 구매 후 다음 영업 전에 짧은 컷씬이 한 번만 나온다 (세이브 후 다시 보지 않음)
- [ ] 가게 앞 "마라판다" 간판이 "마라부자"로 바뀌는 순간이 보인다 (오프닝과 같은 무대·대사 상자)
- [ ] 판다 사장님이 한마디 한다 — 밝고 따뜻한 톤 (예: "이제 진짜 네 가게구나… 아니, 아직 권리금 남았다?")
- [ ] 건너뛰기로 바로 영업으로 갈 수 있다
- [ ] 이후 가게 이름 표시(대사·단면 간판)가 "마라부자"다

---

## Implementation Notes

- `OPENING_SCENES` 방식(`enter`/`leave`/`bgAt`, 자막) 재사용.
- 배경: 1장 가게 정면의 핑크 "마라부자" 버전 (`tools/art/scene_office.py` 모드 추가).
- 플래그 `signSwapSeen` 저장 + `normalize`.

---

## Out of Scope

- Story 005: 4단계 구매 로직
- 엔딩(권리금 완납) 컷씬 (이 에픽 밖)

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above.*

---

## Test Evidence

*At `qa.level: minimal` the evidence below is **waived** (advisory); the retained screenshot for anything visible is not.*

**Story Type**: Visual/Feel
**Required evidence**: `production/qa/evidence/sign-swap-cutscene/` 스크린샷 + 한 번만 나오는지 확인
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 005
- Unlocks: None
