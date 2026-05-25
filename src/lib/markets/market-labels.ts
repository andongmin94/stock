const categoryLabels: Record<string, string> = {
  stocks: "주식",
  indices: "지수",
  commodities: "원자재",
  fx: "FX",
  preipo: "비상장",
  crypto: "크립토",
}

export const koreanAssetLabels: Record<
  string,
  {
    koreanName: string
    aliases: string[]
  }
> = {
  "xyz:AAPL": {
    koreanName: "애플",
    aliases: ["아이폰", "맥북", "apple"],
  },
  "xyz:AMD": {
    koreanName: "AMD",
    aliases: ["에이엠디", "어드밴스드 마이크로 디바이시스", "advanced micro devices"],
  },
  "xyz:AMZN": {
    koreanName: "아마존",
    aliases: ["아마존닷컴", "amazon"],
  },
  "xyz:BABA": {
    koreanName: "알리바바",
    aliases: ["알리", "alibaba"],
  },
  "xyz:BIRD": {
    koreanName: "올버즈",
    aliases: ["allbirds"],
  },
  "xyz:BX": {
    koreanName: "블랙스톤",
    aliases: ["blackstone"],
  },
  "xyz:COIN": {
    koreanName: "코인베이스",
    aliases: ["coinbase"],
  },
  "xyz:COST": {
    koreanName: "코스트코",
    aliases: ["costco"],
  },
  "xyz:CRCL": {
    koreanName: "서클",
    aliases: ["circle"],
  },
  "xyz:CRWV": {
    koreanName: "코어위브",
    aliases: ["coreweave"],
  },
  "xyz:DKNG": {
    koreanName: "드래프트킹스",
    aliases: ["draftkings"],
  },
  "xyz:DRAM": {
    koreanName: "DRAM ETF",
    aliases: ["디램", "메모리", "memory"],
  },
  "xyz:EWJ": {
    koreanName: "일본 ETF",
    aliases: ["일본", "japan"],
  },
  "xyz:EWY": {
    koreanName: "한국 ETF",
    aliases: ["한국", "korea"],
  },
  "xyz:EWZ": {
    koreanName: "브라질 ETF",
    aliases: ["브라질", "brazil"],
  },
  "xyz:GME": {
    koreanName: "게임스탑",
    aliases: ["gamestop", "밈주식"],
  },
  "xyz:GOOGL": {
    koreanName: "구글",
    aliases: ["알파벳", "google", "alphabet"],
  },
  "xyz:HIMS": {
    koreanName: "힘스앤허스",
    aliases: ["힘스", "hims", "hims & hers"],
  },
  "xyz:HOOD": {
    koreanName: "로빈후드",
    aliases: ["robinhood"],
  },
  "xyz:HYUNDAI": {
    koreanName: "현대차",
    aliases: ["현대자동차", "현대", "005380", "005380.KS"],
  },
  "xyz:INTC": {
    koreanName: "인텔",
    aliases: ["intel"],
  },
  "xyz:KIOXIA": {
    koreanName: "키옥시아",
    aliases: ["kioxia"],
  },
  "xyz:LITE": {
    koreanName: "루멘텀",
    aliases: ["lumentum"],
  },
  "xyz:LLY": {
    koreanName: "일라이릴리",
    aliases: ["릴리", "eli lilly", "elililly"],
  },
  "xyz:META": {
    koreanName: "메타",
    aliases: ["페이스북", "facebook"],
  },
  "xyz:MRVL": {
    koreanName: "마벨",
    aliases: ["마벨 테크놀로지", "marvell"],
  },
  "xyz:MSFT": {
    koreanName: "마이크로소프트",
    aliases: ["마소", "microsoft"],
  },
  "xyz:MSTR": {
    koreanName: "스트래티지",
    aliases: ["마이크로스트래티지", "microstrategy", "strategy"],
  },
  "xyz:MU": {
    koreanName: "마이크론",
    aliases: ["micron"],
  },
  "xyz:NFLX": {
    koreanName: "넷플릭스",
    aliases: ["netflix"],
  },
  "xyz:NVDA": {
    koreanName: "엔비디아",
    aliases: ["엔비", "nvidia"],
  },
  "xyz:ORCL": {
    koreanName: "오라클",
    aliases: ["oracle"],
  },
  "xyz:PLTR": {
    koreanName: "팔란티어",
    aliases: ["palantir"],
  },
  "xyz:RIVN": {
    koreanName: "리비안",
    aliases: ["rivian"],
  },
  "xyz:RKLB": {
    koreanName: "로켓랩",
    aliases: ["rocketlab", "rocket lab"],
  },
  "xyz:SKHX": {
    koreanName: "SK하이닉스",
    aliases: ["하이닉스", "에스케이하이닉스", "000660", "000660.KS"],
  },
  "xyz:SMSN": {
    koreanName: "삼성전자",
    aliases: ["삼성", "삼전", "005930", "005930.KS"],
  },
  "xyz:SNDK": {
    koreanName: "샌디스크",
    aliases: ["sandisk"],
  },
  "xyz:SOFTBANK": {
    koreanName: "소프트뱅크",
    aliases: ["softbank"],
  },
  "xyz:TSLA": {
    koreanName: "테슬라",
    aliases: ["tesla", "일론", "전기차"],
  },
  "xyz:TSM": {
    koreanName: "TSMC",
    aliases: ["티에스엠씨", "대만반도체", "타이완반도체", "taiwan semiconductor"],
  },
  "xyz:URNM": {
    koreanName: "우라늄 ETF",
    aliases: ["우라늄", "uranium"],
  },
  "xyz:USAR": {
    koreanName: "USA 레어어스",
    aliases: ["희토류", "레어어스", "rare earth", "rareearth"],
  },
  "xyz:XLE": {
    koreanName: "에너지 ETF",
    aliases: ["에너지", "energy"],
  },
  "xyz:ZM": {
    koreanName: "줌",
    aliases: ["줌비디오", "zoom"],
  },
}

export function categoryLabel(category?: string) {
  if (!category) {
    return "기타"
  }

  return categoryLabels[category.toLowerCase()] ?? category.toUpperCase()
}
