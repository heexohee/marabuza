# 클라우드 저장 설정 (Supabase + 카카오 로그인)

로그인·클라우드 저장 모듈은 [`src/js/cloud.js`](../src/js/cloud.js)예요. 특정 게임 흐름에 묶여 있지 않고, 흐름마다 **저장 칸(slot)**을 따로 써요([흐름 구분](flows.md)).
아래 설정을 마치고 `src/js/cloud-config.js`를 채우면, 연결된 흐름의 타이틀 화면에 **카카오 로그인** 버튼이 나타나요.
설정 파일이 없으면 버튼은 숨겨지고, 게임은 이 기기(localStorage)에만 저장돼요.

| 흐름 | 저장 칸 | 연결 상태 |
|---|---|---|
| 셀프 담기 (현재 게임) | `self-serve` | 아직 안 붙음 — 아래 "셀프 담기에 연결하기" 참고 |
| 사장님 담기 (레거시 데모) | `legacy` | 붙어 있음 (`src/js/main.js`) |

## 1. Supabase 프로젝트 만들기
1. https://supabase.com 에서 새 프로젝트를 만들어요.
2. **SQL Editor** → 새 쿼리 → [`supabase/saves.sql`](../supabase/saves.sql) 내용을 붙여넣고 실행해요.
   - `saves` 테이블(사용자 × 저장 칸마다 한 줄)과, 자기 저장 데이터만 읽고 쓸 수 있는 보안 규칙(RLS)이 만들어져요.
3. **Project Settings → API**에서 두 값을 메모해요.
   - Project URL (`https://xxxx.supabase.co`)
   - anon(공개) 키 또는 `sb_publishable_...` 키 — **service_role 키는 절대 쓰지 마세요.**

## 2. 카카오 앱 만들기 (Kakao Developers)
1. https://developers.kakao.com → 내 애플리케이션 → 애플리케이션 추가하기.
2. **앱 설정 → 플랫폼 키**에서 REST API 키를 확인해요. 이게 `Client ID`예요.
3. 같은 REST API 키 화면에서 **카카오 로그인 Client Secret**을 발급하고 **활성화**해요. 이게 `Client Secret`이에요.
4. **제품 설정 → 카카오 로그인 → 일반**에서 상태를 **ON**으로 바꾸고, **Redirect URI**에
   `https://<프로젝트 ID>.supabase.co/auth/v1/callback`을 등록해요.
5. **동의항목**에서 `profile_nickname`(닉네임), `profile_image`(프로필 사진)를 켜요.
   - 이메일(`account_email`)은 비즈 앱 전환이 필요해서 **켜지 않아요.** 게임 저장에는 필요 없어요.

## 3. Supabase에 카카오 연결하기
1. **Authentication → Sign In / Providers → Kakao**를 켜고, 2단계의 `Client ID`(REST API 키)와 `Client Secret`을 넣어요.
2. 같은 화면에서 **Allow users without an email**을 켜요. (이메일 동의항목을 안 쓰기 때문이에요.)
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:8123`
   - Redirect URLs: `http://localhost:8124/**`(셀프 담기)와 `http://localhost:8123/**`(레거시 데모) 추가 (배포하면 배포 주소도 추가)

## 4. 게임에 연결하기
```bash
cp src/js/cloud-config.example.js src/js/cloud-config.js
```
`src/js/cloud-config.js`에 1단계의 URL과 anon 키를 넣어요. 이 파일은 `.gitignore`에 들어 있어서 커밋되지 않아요.

## 동작 방식
- (레거시 데모 기준) 상점에서 구매·해금·업그레이드·가격 변경을 할 때마다 이 기기에 저장되고, 로그인 중이면 클라우드 `legacy` 칸에도 올라가요.
- **이어하기**는 이 기기 저장과 클라우드 저장 중 **더 최근 것**을 불러와요.
- 클라우드에서 받은 데이터도 로컬 저장과 똑같이 검사(`isValidSave`)를 통과해야만 불러와요.
- 다른 기기에서 이어하려면 게임을 배포해서 같은 주소로 접속해야 해요. (로컬 `localhost`는 이 컴퓨터에서만 열려요.)

## 셀프 담기에 연결하기 (셀프 담기 담당 세션용)

`cloud.js`는 흐름 코드를 임포트하지 않아요. 셀프 담기 쪽에서 자기 저장 검사 함수와 `'self-serve'` 칸을 넘기면 돼요.
레거시 `src/js/main.js`의 `persist` · `startCloud` · `cloudActions`가 그대로 참고 구현이에요.

```js
import { connectCloud } from '../cloud.js'
import { isValidSave } from './save.js' // 셀프 담기 저장 형식 검사

const cloud = await connectCloud({ isValidSave, slot: 'self-serve' }) // 설정 없으면 null → 로그인 UI 숨김
cloud?.onChange(async (user) => { /* 로그인 표시 갱신, user면 await cloud.pullSave()로 최신본 받기 */ })
cloud?.signIn(location.origin + location.pathname) // 카카오 로그인 버튼
cloud?.pushSave(data)  // 로컬 저장 직후, 로그인 중이면 호출 (false면 실패 토스트)
cloud?.signOut()
```

- `pushSave` / `pullSave`는 넘겨준 `isValidSave`를 통과한 데이터만 올리고 돌려줘요.
- 이어하기는 로컬과 클라우드 중 더 최근 저장본을 고르도록, 저장 데이터에 저장 시각(`savedAt`, ms)을 넣어 두는 걸 권장해요.
- 카카오 닉네임(`cloud.displayName()`)은 외부 값이라 화면에 넣기 전에 이스케이프해야 해요.
