<p align="center">
  <img src="./public/stock.svg" width="112" alt="Stock 로고" />
</p>

<h1 align="center">Stock</h1>

<p align="center">
  Hyperliquid <code>xyz</code> 마켓 가격을 Upbit <code>USDT/KRW</code> 환율로 원화 환산해서 보는 관심종목 대시보드입니다.
</p>

<p align="center">
  <strong>원화 환산 시세</strong> · <strong>5초 자동 갱신</strong> · <strong>드래그 정렬</strong> · <strong>원형 테마 전환</strong>
</p>

## 빠른 실행

```sh
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 됩니다.

다른 포트로 실행하려면 Next 인자를 그대로 넘길 수 있습니다.

```sh
npm run dev -- -p 3001
```

## 주요 기능

- Hyperliquid `xyz` 종목을 원화 기준으로 표시
- Upbit `USDT/KRW` 환율 기반 원화 환산
- 한국 종가가 있으면 한국 종가 대비, 없으면 Hyperliquid 전일가 대비 등락 표시
- 한국어 이름, 티커, 별칭 기반 종목 검색
- 관심종목 추가/삭제/초기화와 로컬 저장
- 카드 드래그 정렬
- 기본/컴팩트 보기 모드
- 라이트/다크 모드와 버튼 위치에서 퍼지는 원형 테마 전환
- 가격 변경 시 숫자 플래시 애니메이션
- 자동 갱신 실패 또는 오래된 데이터 상태 표시

## 데이터 흐름

```text
브라우저
  -> /api/markets
    -> Hyperliquid metaAndAssetCtxs
    -> Hyperliquid perpConciseAnnotations
    -> Upbit KRW-USDT ticker
    -> Yahoo Finance 한국 종가 보조 데이터
  -> 관심종목/보기/테마 상태를 localStorage에 저장
```

서버 API는 같은 순간 들어오는 요청을 공유하고 4초 동안 짧게 캐시합니다. 여러 탭이 동시에 자동 갱신해도 외부 API 요청이 불필요하게 겹치지 않게 하기 위한 장치입니다.

## 갱신 정책

- 클라이언트 자동 갱신: 5초 간격
- 갱신 타이밍: 현재 시각 기준 5초 경계에 맞춤
- 오래된 데이터 표시: 마지막 생성 시각 기준 30초 초과
- 서버 캐시: 4초

## 로컬 저장값

| 항목 | 키 |
| --- | --- |
| 관심종목 | `hl-kr-watchlist-v2` |
| 테마 | `hl-kr-theme` |
| 보기 모드 | `hl-kr-view-mode` |

저장값이 깨졌거나 잘못된 형식이면 기본값으로 복구합니다.

## 스크립트

모든 `package.json` 스크립트는 `scripts/tasks.mjs`를 거쳐 실행됩니다.

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | Next 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | `oxlint --fix`, `oxfmt`, `package.json` 줄맞춤 실행 |

## 개발 체크

변경 후에는 아래 순서로 확인하는 것을 권장합니다.

```sh
npm run lint
npx tsc --noEmit
npx --yes knip --reporter compact
npm run build
```

## 주요 구조

```text
src/app
  page.tsx                 앱 진입점
  api/markets/route.ts     시세 API 라우트

src/components/markets
  market-dashboard.tsx     대시보드 조립
  asset-card.tsx           종목 카드
  asset-search-dialog.tsx  종목 검색 모달
  hooks/                   데이터, 검색, 정렬, 설정 훅
  markets.css              대시보드 전용 스타일

src/lib/markets
  markets-service.ts       시세 조회/캐시 서비스
  providers/               Hyperliquid, Upbit, Yahoo 클라이언트
  build-market-assets.ts   API 응답을 화면용 종목 데이터로 변환

scripts/tasks.mjs          개발 명령 실행기
```

## 외부 API

별도 API 키 없이 공개 엔드포인트를 사용합니다.

- Hyperliquid: 마켓 메타데이터, 현재가, 주석 데이터
- Upbit: `KRW-USDT` 환율
- Yahoo Finance: 한국 종가 보조 데이터

외부 API 요청 실패 시 화면에는 재시도 가능한 오류 상태가 표시되고, 자동 갱신이 계속 재시도합니다.
