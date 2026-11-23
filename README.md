# DANGOL (단골)

사주를 웹툰처럼 읽어 주는 웹 서비스 [단골](https://dangolsaju.app)의 공개용 소스입니다.

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- 만세력 계산: lunar-javascript, 시간대: luxon, 도시 좌표: city-timezones
- 테스트: vitest

## 들어 있는 것

- `src/lib/saju`: 만세력 계산 엔진 (순수 함수)
- `src/lib/reading`: 무료 풀이 문장 고르기와 성격·흐름 계산
- `src/components`, `src/app`: 화면과 API 라우트
- `src/content`: 한국어·영어·일본어 화면 문구
- `public`: 화면에 쓰는 그림과 영상
- `tests`: 위 코드의 단위 테스트

## 빠진 것

유료 풀이를 쓰는 AI 지침과 생성 코드, 견본 풀이, 관리자 도구, 데이터베이스 설정, 내부 문서는 이 저장소에 넣지 않았습니다. 그래서 이 저장소만으로는 빌드가 되지 않고, 단위 테스트만 돌릴 수 있습니다.

```bash
npm install
npm test
```

## 저작권

© 도깨비웍스(DokkaebiWorks). 모든 권리를 보유합니다. 코드를 읽는 것은 자유지만, 허락 없이 복제하거나 다른 서비스에 쓰는 것은 허용하지 않습니다. 문의는 admin@dokkaebiworks.com 으로 보내 주세요.
