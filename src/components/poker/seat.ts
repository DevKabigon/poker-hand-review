// components/poker/seat.ts
export type SeatCoord = { top: string; left: string };

type TableVariant = "desktop" | "mobile";
type ChipZone =
  | "top"
  | "topRight"
  | "right"
  | "bottomRight"
  | "bottom"
  | "bottomLeft"
  | "left"
  | "topLeft";

type ChipNudge = { x: number; y: number };
type ChipOffsetProfile = {
  cxPct: number;
  cyPct: number;
  pullPx: number;
  xScale: number;
  yScale: number;
  zoneNudge: Partial<Record<ChipZone, ChipNudge>>;
};

export const CHIP_OFFSET_PRESET: Record<TableVariant, ChipOffsetProfile> = {
  desktop: {
    cxPct: 50,
    cyPct: 50,
    pullPx: 80,
    xScale: 1.4,
    yScale: 1,
    zoneNudge: {
      top: { x: 0, y: 20 },
      topLeft: { x: 0, y: 5 },
      topRight: { x: 0, y: 5 },
      bottom: { x: 0, y: -20 },
    },
  },
  mobile: {
    cxPct: 50,
    cyPct: 35,
    pullPx: 60,
    xScale: 0.8,
    yScale: 1,
    zoneNudge: {
      top: { x: 0, y: 5 },
      topLeft: { x: 0, y: 4 },
      topRight: { x: 0, y: 4 },
      bottom: { x: 0, y: -20 },
      right: { x: -20, y: 0 },
      left: { x: 20, y: 0 },
      bottomLeft: { x: 30, y: 0 },
      bottomRight: { x: -30, y: 0 },
    },
  },
};

type MakeSeatCoordsOpts = {
  count: number;
  variant: "desktop" | "mobile";

  // 타원 중심/반지름(%) — 화면 비율에 맞게 튜닝
  cx?: number; // 0~100
  cy?: number; // 0~100
  rx?: number; // 0~100
  ry?: number; // 0~100
  // 좌우/상하를 따로 제어하고 싶을 때 사용
  // (개별값이 없으면 rx/ry를 fallback으로 사용)
  rxLeft?: number;
  rxRight?: number;
  ryTop?: number;
  ryBottom?: number;

  // 히어로를 아래 중앙(= 90도)로 두기 위한 회전 오프셋(라디안)
  // 기본: 아래 중앙에서 시작해서 반시계로 배치
  startAngleRad?: number;

  // 위쪽(로고 영역) 살짝 비우고 싶을 때
  topPaddingPct?: number; // e.g. 0~8
};

export function makeSeatCoords({
  count,
  variant,
  cx,
  cy,
  rx,
  ry,
  rxLeft,
  rxRight,
  ryTop,
  ryBottom,
  startAngleRad,
  topPaddingPct = 0,
}: MakeSeatCoordsOpts): SeatCoord[] {
  if (count < 2) return [];

  // 기본 좌석 배치값(여기만 수정하면 전체 페이지에 반영됨)
  // desktop: 가로형, mobile: 세로형 느낌
  const base =
    variant === "mobile"
      ? { cx: 50, cy: 50, rxLeft: 45, rxRight: 45, ryTop: 45, ryBottom: 45 }
      : { cx: 50, cy: 54, rxLeft: 50, rxRight: 50, ryTop: 45, ryBottom: 40 };

  const _cx = cx ?? base.cx;
  const _cy = cy ?? base.cy;

  // rx/ry를 전달하면 좌우/상하를 동시에 덮어쓰고,
  // rxLeft/rxRight/ryTop/ryBottom이 있으면 개별값이 우선한다.
  const _rxLeft = rxLeft ?? rx ?? base.rxLeft;
  const _rxRight = rxRight ?? rx ?? base.rxRight;
  const _ryTop = ryTop ?? ry ?? base.ryTop;
  const _ryBottom = ryBottom ?? ry ?? base.ryBottom;

  // 아래 중앙에서 시작(= +90deg)하면 히어로가 Bottom Center에 놓임
  const start = startAngleRad ?? Math.PI / 2;

  const coords: SeatCoord[] = [];
  for (let i = 0; i < count; i++) {
    const t = start + (i * 2 * Math.PI) / count; // 균등 분할
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);

    // 좌/우, 상/하 반지름을 분리해서 비대칭 테이블 좌석 배치를 지원
    const xRadius = cosT >= 0 ? _rxRight : _rxLeft;
    const yRadius = sinT >= 0 ? _ryBottom : _ryTop;
    const x = _cx + xRadius * cosT;
    let y = _cy + yRadius * sinT;

    // 상단 여백 확보(로고/보드 영역과 겹치면)
    // y가 너무 위로 올라가면 살짝 아래로 눌러줌
    if (topPaddingPct > 0) {
      const minY = topPaddingPct;
      if (y < minY) y = minY;
    }

    coords.push({
      left: `${x.toFixed(2)}%`,
      top: `${y.toFixed(2)}%`,
    });
  }

  return coords;
}

export function rotateCoordsToHero(
  coords: SeatCoord[],
  heroSeat: number,
): SeatCoord[] {
  const n = coords.length;
  if (n === 0) return coords;
  const k = ((heroSeat % n) + n) % n; // 안전하게

  // heroSeat가 coords[0] 위치(= bottom center)에 오게 하려면
  // coords를 k만큼 왼쪽으로 rotate
  return coords.slice(k).concat(coords.slice(0, k));
}

export function chipOffsetForSeat(params: {
  seatCoord: SeatCoord; // {left:"..%", top:"..%"}
  variant?: TableVariant;
  cxPct?: number; // 좌표 생성에 쓴 중심과 동일하게
  cyPct?: number;
  pullPx?: number; // 안쪽으로 끌어당기는 정도
}) {
  const resolveZone = (
    seatX: number,
    seatY: number,
    centerX: number,
    centerY: number,
  ): ChipZone => {
    // 0도=오른쪽, 90도=아래, 180도=왼쪽, 270도=위
    const angleDeg =
      ((Math.atan2(seatY - centerY, seatX - centerX) * 180) / Math.PI + 360) %
      360;
    if (angleDeg >= 337.5 || angleDeg < 22.5) return "right";
    if (angleDeg < 67.5) return "bottomRight";
    if (angleDeg < 112.5) return "bottom";
    if (angleDeg < 157.5) return "bottomLeft";
    if (angleDeg < 202.5) return "left";
    if (angleDeg < 247.5) return "topLeft";
    if (angleDeg < 292.5) return "top";
    return "topRight";
  };

  const {
    seatCoord,
    variant = "desktop",
    cxPct = CHIP_OFFSET_PRESET[variant].cxPct,
    cyPct = CHIP_OFFSET_PRESET[variant].cyPct,
    pullPx = CHIP_OFFSET_PRESET[variant].pullPx,
  } = params;
  const profile = CHIP_OFFSET_PRESET[variant];

  const x = parseFloat(seatCoord.left);
  const y = parseFloat(seatCoord.top);

  // seat -> center 방향 벡터
  const dx = cxPct - x;
  const dy = cyPct - y;

  // normalize
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const zone = resolveZone(x, y, cxPct, cyPct);
  const nudge = profile.zoneNudge[zone] ?? { x: 0, y: 0 };
  const tx = ux * pullPx * profile.xScale + nudge.x;
  const ty = uy * pullPx * profile.yScale + nudge.y;

  // px 단위 translate
  return {
    transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px)`,
  };
}

/**
 * 플레이어의 Seat 번호를 물리적인 테이블 위치 인덱스로 변환합니다.
 * @param seatIndex 플레이어의 실제 좌석 번호
 * @param heroSeat 히어로의 좌석 번호
 * @param maxPlayers 전체 좌석 수
 * @returns 물리적인 위치 인덱스 (0이 6시 방향)
 */
export function getPhysicalIndex(
  seatIndex: number,
  heroSeat: number,
  maxPlayers: number,
): number {
  // 물리적 인덱스 = (현재 좌석 - 히어로 좌석 + 전체 좌석) % 전체 좌석
  return (seatIndex - heroSeat + maxPlayers) % maxPlayers;
}

/**
 * 기존 rotateCoordsToHero를 좀 더 안전하고 직관적으로 수정
 */
export function getRotatedCoords(
  baseCoords: SeatCoord[],
  heroSeat: number | null,
  maxPlayers: number,
): Record<number, SeatCoord> {
  const rotatedMap: Record<number, SeatCoord> = {};

  // 히어로가 없으면 그냥 순서대로 배치
  if (heroSeat === null) {
    baseCoords.forEach((coord, i) => {
      rotatedMap[i] = coord;
    });
    return rotatedMap;
  }

  // 각 Seat 번호(i)가 어떤 물리적 좌표를 써야 하는지 계산
  for (let i = 0; i < maxPlayers; i++) {
    const physicalIdx = getPhysicalIndex(i, heroSeat, maxPlayers);
    rotatedMap[i] = baseCoords[physicalIdx];
  }

  return rotatedMap;
}
