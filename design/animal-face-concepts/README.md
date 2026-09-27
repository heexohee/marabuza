# 동물 얼굴 디자인 시안

2026-09-28 · codex/panda-owner-design · built-in image_gen

상태: 사용자 선택 전 시안, 게임 미반영. 판다 A안의 색감과 픽셀 표현을 참고함.

## 전체 구성

animal-lineup-v1.png: 윗줄 왼쪽부터 개구리, 고양이, 토끼, 참새. 아랫줄 왼쪽부터 호랑이, 돼지, 너구리.

rabbit-candidates-v1.png: 왼쪽 A 곧은 귀, 가운데 B 한쪽 접힌 귀, 오른쪽 C 처진 귀. 추천 B: 작은 얼굴 아이콘에서도 실루엣을 구별하기 쉽고 알바생 전신에 같은 특징을 이어갈 수 있음.

스토리 근거: design/game-brief.md의 시험기간 토끼, 야근 너구리 및 29일차 알바 지원 장면. 토끼의 얼굴 정체성을 결정한 후 전신과 앞치마 착용 디자인으로 확장.

육안 확인: 7종 모두 얼굴만 표현, 귀/부리/코/무늬로 구분, 토끼 3종의 귀 실루엣 구분 가능. 합본 외곽에 생성된 번짐이 남아 있어 승인 후 개별 분리, 배경 정리, 실제 UI 크기에 맞춘 도트 및 알파 정리가 필요함. 현재 이미지를 게임용 최종 스프라이트로 취급하지 않음.

## 생성 프롬프트

### 전체 구성

Use case: stylized-concept. Reference image is the approved panda game character; use it ONLY as pixel-art style reference. Match its warm muted palette, ivory highlights, chunky square pixel clusters, restrained dark outlines and gentle understated facial expressions. Strict 2D low-resolution pixel art, drawn as native about 48x48 portraits enlarged nearest neighbor; 2-3 flat shades per material; NO gradients, glow, blur, smooth vector curves, glossy mobile emoji, 3D, excessive dithering, or big sparkly anime eyes. HEADS ONLY floating isolated portraits with ears fully visible: no neck, shoulders, bodies, clothing, accessories or cast shadows. Consistent front/slight three-quarter orientation and facial scale, clean square step edges, genuine transparent background. Create ONE cohesive character lineup concept sheet, seven distinct heads arranged four evenly spaced across top row and three centered evenly spaced across bottom row. Wide landscape canvas, generous empty gutters so none overlap. Top row left to right: 1 sage-green frog, broad low mouth and slightly raised eyes, placid small smile; 2 warm gray domestic cat, triangular ears and ivory muzzle, slightly reserved eyes; 3 ivory rabbit with dusty pink ear interiors, viewer-left ear upright and viewer-right ear gently bent at the tip, friendly focused student expression; 4 small warm brown sparrow with beige cheek patches and tiny ochre beak, alert expression. Bottom row left to right: 5 ochre orange tiger with clear dark forehead and cheek stripes, rounded ears, ivory cheeks, soft confident smile; 6 dusty rose pig with broad rounded snout, two distinct nostrils and folded triangular ears, cheerful relaxed face; 7 brown-gray raccoon dog/tanuki with rounded triangular ears and a dark eye mask connected across nose bridge, cream cheeks, slightly tired yet kind eyes, distinguishable from panda and cat. Each animal must remain recognizable at small game UI size. No text, numbers, panels, borders or labels. Exactly seven heads, no panda.

### 토끼 후보

Use case: stylized-concept. Reference image is the approved panda game character; use it ONLY as pixel-art style reference. Match its warm muted palette, ivory highlights, chunky square pixel clusters, restrained dark outlines and gentle understated facial expressions. Strict 2D low-resolution pixel art, drawn as native about 48x48 portraits enlarged nearest neighbor; 2-3 flat shades per material; NO gradients, glow, blur, smooth vector curves, glossy mobile emoji, 3D, excessive dithering, or big sparkly anime eyes. HEADS ONLY floating isolated portraits with ears fully visible: no neck, shoulders, bodies, clothing, accessories or cast shadows. Consistent front/slight three-quarter orientation and facial scale, clean square step edges, genuine transparent background. Create ONE rabbit casting comparison sheet containing exactly THREE head-only candidate designs in one evenly spaced horizontal row, each with adequate top margin for long ears. All are youthful adult/student rabbit characters for a cozy malatang game who will later become a part-time employee. Same scale and warm ivory fur, dusty pink inner ears, dark small eyes, small pink-brown nose and restrained smile. Left candidate A: both long ears upright with slight asymmetry, narrow oval cheeks, bright attentive eyes, dependable studious mood. Middle candidate B: one long ear upright and other ear bent distinctly at its upper third, softly angular round cheeks, gentle confident small smile, memorable friendly hardworking personality; this is the strongest iconic lead candidate. Right candidate C: two softly outward-drooping ears, slightly elongated face, mildly sleepy eyes with a warm subtle smile, quiet observant personality. Make genuinely distinct silhouettes and facial expressions while retaining the SAME art style as the panda reference. No necks, body, apron, headband, glasses, hats, props, text, letters, numbers, watermark or panels. Entire ears visible. Transparent background. This is a concept comparison sheet, not an animation.

