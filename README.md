# Stock

Hyperliquid `xyz` 마켓 가격을 Upbit `USDT/KRW` 환율로 원화 환산해서 보는 관심종목 대시보드입니다.

## 실행

```sh
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 됩니다.

## 주요 기능

- 관심종목 로컬 저장
- 원화 환산 가격 표시
- 한국 종가 또는 Hyperliquid 전일가 대비 등락 표시
- 한국어 종목 검색
- 카드 순서 드래그 정렬
- 기본/컴팩트 보기와 다크 모드

## 데이터

- Hyperliquid API
- Upbit USDT/KRW ticker
- Yahoo Finance 한국 종가 보조 데이터
