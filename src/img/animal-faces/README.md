# 대기열 동물 얼굴

2026-09-28 승인된 정면 시안을 대기열에 반영.

- 원본: `design/animal-face-concepts/front-v2/original-seven-front.png`, `additional-seven-front.png`.
- 14종 각각 48×48 PNG, 가장 긴 변 44px, 아래 여백 2px. 최근접 축소, 알파 128 기준 이진화, 최대 24색 팔레트, 디더링 없음.
- 게임 연결: `src/js/self-serve/animal-faces.js`. 일반 손님 12종 및 단골 너구리 매핑. 참새는 이미지와 매핑을 준비했으며 손님 출현 목록은 기존 설정을 사용.
- 적용 범위: 셀프 담기 대기열. 좌석, 주문표, 스토리 얼굴은 기존 표현 유지.
- 검증: 이미지 연결/규격 및 스토리 테스트 35개 통과, 릴리스 복사본과 원본 일치, 14개 PNG 알파 0/255 확인. 실제 대기열의 고양이·코알라·토끼 이미지 표시 확인.
- 실행 증거: `production/qa/evidence/animal-queue/queue.png`.
