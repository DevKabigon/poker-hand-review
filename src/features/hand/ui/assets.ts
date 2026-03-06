// src/features/hand/ui/assets.ts

import { CARD_RANKS_MAP, CARD_SUITS_MAP, CHIP_VALUES } from "./constants";

export const getCardImage = (cardCode: string) => {
  if (!cardCode || cardCode === "BACK") return "/cards/back01.png";
  const rankChar = cardCode[0] as keyof typeof CARD_RANKS_MAP;
  const suitChar = cardCode[1] as keyof typeof CARD_SUITS_MAP;

  const rank = CARD_RANKS_MAP[rankChar] || `0${rankChar}`;
  const suit = CARD_SUITS_MAP[suitChar];

  return `/cards/${suit}_${rank}.png`;
};

export const getChipStack = (amount: number) => {
  let remaining = amount;
  const chips: string[] = [];

  CHIP_VALUES.forEach((chip) => {
    const count = Math.floor(remaining / chip.value);
    for (let i = 0; i < count; i++) {
      chips.push(chip.src);
    }
    remaining %= chip.value;
  });

  // ✅ 소수점 값 처리: 남은 값이 0보다 크면 가장 작은 칩(1)을 사용
  // 소수점 값도 시각적으로 표시하기 위해
  if (remaining > 0 && remaining < 1) {
    // 소수점 값이 있으면 가장 작은 칩(1)을 사용하되, 비율에 맞게 표시
    // 예: 0.25면 1개 칩, 0.5면 1개 칩 (시각적 표현)
    chips.push(CHIP_VALUES[CHIP_VALUES.length - 1].src);
  }

  return chips.slice(0, 5).reverse();
};
