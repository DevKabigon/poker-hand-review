// src/features/hand/editor/services/streetAdvanceService.ts

import type { TimelineEvent } from "../../domain/events";
import type { HandConfig, SeatIndex } from "../../domain/handConfig";
import type { Card } from "../../domain/cards";
import { computeBettingDerived } from "../../engine/bettingDerived";
import { getNextActor } from "../../engine/nextActor";
import { getNextStreet } from "../../engine/getNextStreet";
import { replayToCursor } from "../../engine/reducer";
import { eventFactory } from "../../domain/eventFactories";
import {
  isHandOverByFolds,
  areAllActivePlayersAllIn,
} from "../../engine/streetCompletion";

export type ShouldAdvanceStreetParams = {
  events: TimelineEvent[];
  cursor: number;
  config: HandConfig;
  buttonSeat: SeatIndex;
};

export type ShouldAdvanceStreetResult = {
  shouldAdvance: boolean;
  nextStreet?: "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
};

/**
 * 스트리트 진행 필요 여부 판단
 *
 * @param params 스트리트 진행 판단에 필요한 파라미터
 * @returns 스트리트 진행 여부와 다음 스트리트 정보
 */
export function shouldAdvanceStreet(
  params: ShouldAdvanceStreetParams
): ShouldAdvanceStreetResult {
  const { events, cursor, config, buttonSeat } = params;

  const safeCursor = Math.max(0, Math.min(cursor, events.length));
  const eventsApplied = events.slice(0, safeCursor);

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[shouldAdvanceStreet] events.length=${events.length}, cursor=${cursor}, safeCursor=${safeCursor}, eventsApplied.length=${eventsApplied.length}`
    );
    const actionEvents = eventsApplied.filter((e) => e.type === "ACTION");
    console.log(
      `[shouldAdvanceStreet] ACTION events:`,
      actionEvents.map((e) => ({
        seat: e.payload.seat,
        action: e.payload.action,
        amount: e.payload.amount,
      }))
    );
  }

  if (eventsApplied[0]?.type !== "POST_BLINDS") {
    return { shouldAdvance: false };
  }

  const base = replayToCursor(eventsApplied, eventsApplied.length);
  if (base.street === "SHOWDOWN") {
    return { shouldAdvance: false };
  }

  const betting = computeBettingDerived({
    config,
    street: base.street,
    eventsApplied,
  });

  const actor = getNextActor({
    street: base.street,
    eventsApplied,
    config,
    buttonSeat,
    betting,
  });

  if (actor !== null) {
    return { shouldAdvance: false };
  }

  // ✅ 폴드로 인해 1명만 남았는지 확인
  const foldCheck = isHandOverByFolds({
    config,
    eventsApplied,
  });

  if (foldCheck.over) {
    // 폴드로 인해 1명만 남았으면 SHOWDOWN으로 진행
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[shouldAdvanceStreet] Hand over by folds, winner: seat ${foldCheck.winner}, advancing to SHOWDOWN`
      );
    }
    return {
      shouldAdvance: true,
      nextStreet: "SHOWDOWN",
    };
  }

  // ✅ 모든 활성 플레이어가 올인 상태인지 확인
  const allAllIn = areAllActivePlayersAllIn({
    config,
    eventsApplied,
    betting,
  });

  if (allAllIn) {
    // 모든 플레이어가 올인 상태이면 SHOWDOWN까지 바로 진행
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[shouldAdvanceStreet] All players all-in, advancing to SHOWDOWN`
      );
    }
    return {
      shouldAdvance: true,
      nextStreet: "SHOWDOWN",
    };
  }

  const nextStreet = getNextStreet(base.street);
  if (!nextStreet) {
    return { shouldAdvance: false };
  }

  return {
    shouldAdvance: true,
    nextStreet,
  };
}

export type CreateStreetEventParams = {
  street: "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
  cards?: {
    flop?: [Card, Card, Card];
    turn?: Card;
    river?: Card;
  };
};

/**
 * 스트리트 이벤트 생성
 *
 * @param params 스트리트 이벤트 생성에 필요한 파라미터
 * @returns 생성된 스트리트 이벤트
 * - 카드가 없으면 빈 배열/null로 이벤트 생성 (나중에 추가 가능)
 */
export function createStreetEvent(
  params: CreateStreetEventParams
): TimelineEvent {
  const { street, cards } = params;

  switch (street) {
    case "FLOP": {
      // 카드가 없으면 빈 배열로 스트리트 진행
      if (!cards?.flop) {
        return eventFactory.revealFlop([]);
      }
      return eventFactory.revealFlop(cards.flop);
    }
    case "TURN": {
      // 카드가 없으면 null로 스트리트 진행
      if (!cards?.turn) {
        return eventFactory.revealTurn(null);
      }
      return eventFactory.revealTurn(cards.turn);
    }
    case "RIVER": {
      // 카드가 없으면 null로 스트리트 진행
      if (!cards?.river) {
        return eventFactory.revealRiver(null);
      }
      return eventFactory.revealRiver(cards.river);
    }
    case "SHOWDOWN": {
      return eventFactory.showdown();
    }
  }
}
