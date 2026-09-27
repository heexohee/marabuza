# 착석 손님 비교 시안

2026-09-28 · built-in image_gen · 사용자 B안 선호 확인, 가구 조정 방향 논의 중, 게임 미반영.

seating-options-v1.png: A 얼굴만 / B 얼굴+앞발 / C 작은 상반신. 아래 행은 B 방식을 고양이·개구리·돼지에 적용한 예시. 추천 B.

기존 게임 화면과 승인된 정면 동물 시안을 참고한 확대 콘셉트 이미지이며, 실제 게임 스크린샷 또는 실제 표시 크기 검증 결과가 아님. 테이블의 원근과 크기는 선택 후 현행 게임 레이아웃에 맞춰야 함.

표현 제안: 기다림은 빈 테이블+앞발, 식사 중은 그릇+작은 고개 움직임, 완료는 빈 그릇+기쁜 표정. 새 동작과 자산은 아직 구현하지 않음.

## 기존 가구와 연결

현재 의자는 측면 형태(CSS .chair와 ::after)이며 테이블과 별도 요소다. B안 적용 시 의자 등받이를 정면 형태로 바꾸고 테이블 상판에 얕은 깊이를 주는 방향을 제안한다. 기본 갈색 목재, 인테리어 5~6단계의 민트 의자/흰 상판/분홍 다리 색상은 유지 가능하다. 가게 배경 전체 교체는 필요하지 않으며, 좌석별 배치와 주문 번호/인내심 막대 간격을 함께 확인해야 한다.

## 생성 프롬프트

Create a polished GAME DESIGN COMPARISON BOARD, landscape 1536x1024, strict chunky 2D pixel art matching supplied images. Reference 1 is the existing game environment: honey wood wall, dark brown wainscot, small brown square tables on wooden floor, cozy Korean malatang shop. Reference 2 sets exact animal identities, especially ivory rabbit with viewer-left ear upright and viewer-right ear bent. This is a design proposal, not a screenshot.
Layout: THREE equal vertical columns side-by-side labeled only "A", "B", "C" in small dark pixel font above. SAME table design, SAME scale, SAME front-facing rabbit head identity and size in all columns. All are sitting CUSTOMERS, no apron or work uniform. Keep entire ears and all table legs visible. Each column is a small room vignette with same honey wall and wood floor. Enlarge actual low resolution sprite-style pixels sharply, no painterly effects, no blur, no gradient, no glow, no 3D. Simple readable art, about 80x110 native pixels per vignette enlarged.
A: HEAD ONLY. Rabbit head rests visually just above rear edge of table, chin almost touching back edge. Absolutely NO paws, NO shoulders, NO visible torso. Table conceals whole body. A small off-white bowl of red malatang in center of tabletop, slim steam trail. This is the simplest face-only treatment.
B: HEAD AND TWO PAWS. Exact same rabbit head as A, chin above back edge, two small ivory oval paws resting on tabletop left and right of bowl. Torso entirely hidden by tabletop. Make paws clearly visible and distinct, not arms. This is cute and grounded while minimal. Tiny portion of plain wooden chair back visible behind head lower edge. Same bowl. No visible torso.
C: SMALL UPPER BODY. Same rabbit face/ears/head size, but head positioned a little higher to reveal short shoulders and upper chest in a muted sage casual shirt above rear tabletop edge; short forearms lead to paws beside same bowl. Lower body hidden by table. Plain chair back partially visible behind shoulders. More naturally seated and story-character-like, but still compact. No apron.
Below the three main vignettes, separated by generous blank cream space, place a narrow strip of THREE smaller examples demonstrating B with cat, frog, and pig heads from reference 2, each directly facing viewer behind a tiny table and bowl with species-appropriate small paws on either side (frog hands sage, cat paws gray, pig small pink hooves). No bodies in these B examples. Top main vignettes dominate 75% height; bottom strip 25%. No other text, UI, decorative frames or props. Ensure difference between A no paws, B paws only, C visible torso is unmistakable.
