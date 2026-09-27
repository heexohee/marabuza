# 엔딩 토끼 전신 교체 승인용 시안

상태: 사용자 승인 후 반영 완료. src/img/rabbit-worker.png 및 실제 teaser 장면에 적용.

원본: ../front-v2/rabbit-worker-fullbody.png. image_gen으로 배경 제거만 요청한 후 알파 128 기준 이진화, 여백 trim, 최근접 64×160 contain, 32색 팔레트로 내보냈다.
결과: rabbit-worker-64x160.png.

ending-rabbit-preview.png는 teaserHtml의 29일 토끼 등장 장면을 임시 페이지에서 렌더한 실제 배치 시안. 기존 토끼 이모지를 전신 이미지로 교체하고 rabbit-with-flyer 폭을 판다 자리의 66.667%로 맞춤(64 stage px). img display:block, flyer bottom:35%, left:-35%. 빨간 앞치마와 알바 구함 전단을 유지. 임시 페이지는 캡처 후 삭제.

관련 검증: part2_teaser_test / story_test, 실제 teaser 렌더러로 토끼 등장 장면 확인.
