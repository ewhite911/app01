# Selah Daily — MVP

하루 5분 기도 루틴 앱. 말씀 한 구절(BSB, 퍼블릭 도메인) → 내 기도제목으로 3분 기도 → 아멘 → 공식 YouTube 앱의 찬양 재생목록으로 마무리.
계정·서버·AI·광고·앱 내 오디오·스트릭 없음. 기도제목은 기기 안(SQLite)에만 저장.

## 화면 4개
| 화면 | 파일 | 내용 |
|---|---|---|
| Today | `src/screens/TodayScreen.tsx` | 오늘의 말씀 → 기도제목 체크 + 3분 타이머(진동만) → Amen → YouTube 버튼. 3회차 완료 시 결제 화면 1회 노출 |
| Prayers | `src/screens/PrayersScreen.tsx` | 목록·추가, 탭 = 응답됨, 길게 누름 = 취소/삭제. 무료 10개, 유료 무제한 |
| Paywall | `src/screens/PaywallScreen.tsx` | 월 $3.99 단일, 7일 체험, 종료일 표시, 체험 시작 시 **2일 전 로컬 알림 + 캘린더 일정(선택)** |
| Settings | `src/screens/SettingsScreen.tsx` | 알림 시각 1개, 구독 관리·해지(스토어 페이지), JSON 내보내기, 개인정보·초교파 고지 |

핵심 모듈: `src/db.ts`(SQLite) · `src/verses.ts` + `src/data/verses.json`(365구절) · `src/notifications.ts` · `src/calendar.ts` · `src/purchases.ts`(RevenueCat, 키 없으면 모의 모드) · `src/theme.ts`(색·가격·재생목록 ID).

## 출시 전 반드시 바꿀 값 (`src/theme.ts`, `app.json`)
- `config.youtubePlaylistId` → 실제 재생목록 ID
- `config.supportEmail`, `privacyUrl`, `termsUrl`
- `app.json → extra.rcAndroidKey / rcIosKey` → RevenueCat 공개 키. 비어 있으면 모의 결제 모드로 동작(전체 흐름 테스트 가능)
- `app.json → android.package`, `ios.bundleIdentifier` (현재 `com.tg.selahdaily`)
- `assets/images/*.jpg` → `docs/이미지_가이드_및_프롬프트.md`에 따라 교체(현재는 AI 생성 임시 이미지)

## Windows ARM64에서 실행 (Mac·Android Studio 불필요)
```bash
npm install
npx expo start
```
Android 폰에 **Expo Go**는 쓸 수 없음(RevenueCat·SQLite 네이티브 모듈). 개발 빌드(dev client)를 EAS로 만든다:
```bash
npm i -g eas-cli
eas login
eas init            # app.json extra.eas.projectId 채워짐
eas build -p android --profile development   # APK 링크 → 폰에 설치
npx expo start --dev-client                  # QR로 연결
```
결제 없이 UI만 볼 때는 `purchases.ts`가 모의 모드로 동작한다.

## Google Play 출시 순서
1. Play Console 개발자 등록($25). 개인 계정은 **테스터 12명 × 14일 비공개 테스트** 후 프로덕션 신청 가능.
2. Play Console → 수익 창출 → 구독 상품 `premium_monthly` $3.99, 7일 무료 체험 오퍼 생성.
3. RevenueCat 프로젝트 → Play 연결 → Entitlement `premium` ↔ 상품 매핑 → 공개 키를 `app.json extra.rcAndroidKey`에.
4. `eas build -p android --profile production` (AAB) → `eas submit -p android` (internal track) → 비공개 테스트 → 프로덕션.
5. 스토어 자산: `docs/이미지_가이드_및_프롬프트.md` 참고. 데이터 안전 섹션은 "수집 없음".

## App Store (나중)
- Apple Developer $99/년 → `eas build -p ios` (EAS가 인증서 자동) → `eas submit -p ios` → TestFlight.
- `app.json` iOS 설정과 캘린더·알림 권한 문구는 이미 포함. 심사 노트에 "루틴·기록이 본체, YouTube는 마지막 선택 단계(앱 내 재생 없음)" 명시.

## 하지 않는 것
스트릭, 아침/저녁 모드, 회고, 위젯, 테마, 기도문 라이브러리, 연간·평생 플랜, AI, 서버. 후보는 `docs/추가_아이디어.md`.
