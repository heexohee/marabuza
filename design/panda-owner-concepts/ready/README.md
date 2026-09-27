# A안 게임용 스프라이트 — 승인 및 반영 완료

- 브랜치: codex/panda-owner-design
- `panda-A-96x160.png`: 게임 교체용 96×160 RGBA PNG, 24색 이하, alpha 0/255, 종횡비 보존, 발 아래 2px 여백.
- `panda-A-preview-4x.png`: 동일 스프라이트를 최근접 방식으로 4배 확대.
- `panda-A-scene-preview.png`: 실제 scene-regular 배경을 768×304로 표시하고 게임 좌표 x=408, bottom=18에 96×160 스프라이트를 합성한 배치 미리보기. 실행 화면 캡처가 아님.
- `A-clean-master.png`: built-in image_gen으로 A안을 정리한 원본.

상태: 2026-09-28 사용자 승인 후 src/img/panda.png에 반영 완료. 이미지 캐시 버전 v3, 복원 도구 갱신. 관련 테스트 34개 통과, 릴리스 빌드 성공 및 dist 이미지 일치 확인. 실제 브라우저 오프닝에서 표시 확인: production/qa/evidence/panda-owner-a/opening.png. 현재 게임은 정지 스프라이트를 이동시켜 등장·퇴장하며, 본 파일은 idle 1프레임임.

후처리: sharp로 최근접 축소, 외곽 alpha 이진화, 24색 팔레트 정리. 결과는 22색, alpha는 0/255 두 값만 사용함. 형태와 얼굴은 image_gen 편집본 유지.

## 편집 프롬프트

Edit the attached selected A panda into a production game sprite master. Preserve EXACT character identity, face, head-to-body proportions, red bib apron with front pocket, red tied head kerchief, friendly subtle smile, arms resting by sides, broad heavy adult panda and two distinct feet. Remove ALL glow, colored aura, fog, blurry shading and stray exterior pixels. Genuine transparent background with completely hard silhouette alpha (opaque character, fully transparent outside). Simplify to crisp restrained 24-color pixel art with clean block clusters, sharp square edges and 2-3 shades per material, NO gradients or antialiasing. Eyes and smile must remain legible when reduced. Put entire figure on a portrait canvas exactly 3:5 aspect ratio as an enlarged 96x160 sprite: character centered horizontally, fills 90 percent canvas width, soles at 98 percent canvas height, top of head/kerchief around 5 percent canvas height. Preserve original heavy broad body, do not make slimmer, do not enlarge head, do not redesign costume. ONE neutral idle full-body front/slight three-quarter view; no text, shadows, scene or framing. A ready-to-downsample pixel sprite master.
