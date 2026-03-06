// src/features/hand/domain/handConfig.ts

import { Card } from "./cards";

/**
 * HandConfig (핸드 설정 도메인)
 *
 * 이 파일의 철학:
 * - HandConfig는 "핸드가 시작되기 전에 이미 합의된 고정 조건"이다.
 * - 타임라인 이벤트가 아니다.
 * - Undo / Redo / Replay의 대상이 아니다.
 *
 * 즉,
 * - config는 baseState를 만드는 입력값
 * - events는 시간에 따라 변하는 유일한 진실
 */

/* ===========================
 * 게임 타입
 * =========================== */

export type GameType = "CASH" | "TOURNAMENT";

/* ===========================
 * 안티 / 블라인드 설정
 * =========================== */

/**
 * 안티 모드
 * - NONE: 안티 없음
 * - ANTE: 모든 플레이어 안티
 * - BB_ANTE: BB만 안티
 */
export type AnteMode = "NONE" | "ANTE" | "BB_ANTE";

/**
 * 블라인드 설정
 */
export type BlindsConfig = {
  sb: number; // 스몰 블라인드
  bb: number; // 빅 블라인드
  anteMode: AnteMode;
  anteAmount?: number; // anteMode가 NONE이 아닐 때만 사용
};

/* ===========================
 * 플레이어 / 좌석
 * =========================== */

/**
 * 좌석 번호 규칙
 * - 0부터 시작
 * - maxPlayers 미만
 */
export type SeatIndex = number;

/**
 * 플레이어 설정
 * - 핸드 도중에는 변하지 않는다.
 */
export type PlayerConfig = {
  seat: SeatIndex;
  name: string;
  stack: number; // 시작 스택
  isHero: boolean;
  holdCards: [Card | null, Card | null];
};

/* ===========================
 * HandConfig 본체
 * =========================== */

export type HandConfig = {
  gameType: GameType;

  // 테이블 인원 (2~10)
  maxPlayers: number;

  // 플레이어 설정 (seat 기준으로 고정)
  players: PlayerConfig[];

  // 블라인드/안티 설정
  blinds: BlindsConfig;
};

/* ===========================
 * 유틸 / 가드
 * =========================== */

/**
 * HandConfig 기본 검증
 * - UI에서 웬만한 검증을 하지만
 * - 도메인 레벨에서도 최소한의 방어는 한다.
 */
export function validateHandConfig(config: HandConfig) {
  if (config.maxPlayers < 2 || config.maxPlayers > 10) {
    throw new Error("maxPlayers must be between 2 and 10");
  }

  if (config.players.length !== config.maxPlayers) {
    throw new Error("players length must match maxPlayers");
  }

  const heroCount = config.players.filter((p) => p.isHero).length;
  if (heroCount !== 1) {
    throw new Error("exactly one hero must exist");
  }

  for (const p of config.players) {
    if (p.stack <= 0) {
      throw new Error(`player ${p.name} must have positive stack`);
    }
  }

  const { sb, bb, anteMode, anteAmount } = config.blinds;
  if (sb <= 0 || bb <= 0 || sb >= bb) {
    throw new Error("invalid blind values");
  }

  if (anteMode !== "NONE" && (!anteAmount || anteAmount <= 0)) {
    throw new Error("anteAmount must be provided when anteMode is enabled");
  }
}
