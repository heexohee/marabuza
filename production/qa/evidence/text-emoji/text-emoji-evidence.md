# Evidence — 글자 속 이모지 → 도트 스프라이트 (출시 체크리스트 2026-09-27)

- `day-screen.png` — 영업 화면: "같은 🎫 번호 식탁을 누르세요"의 🎫가 Noto 도트 스프라이트로 그려짐.
- 브라우저 검사(1280×720): 타이틀·설정·엔딩 크레딧·상점 3탭·장부 팝업·오프닝·영업 화면의 텍스트 노드에 남은 이모지 0개
  (©·▶는 글자로 유지). 오프닝 "건너뛰기 ⏭" → `<img class="px txt-emoji" alt="⏭">`.
- 방식: `src/js/self-serve/emoji-text.js` spriteText — self-serve `patch()`와 영업 화면 뼈대가 거침. 태그 속성(title 툴팁)은 그대로.
- Tests: tests/unit/self-serve/emoji_text_test.mjs (4) — suite 371 pass.
