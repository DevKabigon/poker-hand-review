// src/features/hand/db/handService.ts

import { supabase } from "@/lib/supabase/client";
import type { HandRecord, SaveHandInput, UpdateHandInput } from "./types";
import { replayToCursor } from "../engine/reducer";
import type { HandConfig } from "../domain/handConfig";
import type { TimelineEvent } from "../domain/events";
import { computePots } from "../engine/pots";
import { applyUncalledRefund } from "../engine/uncalledRefund";
import { nanoid } from "nanoid";

type HandDbRow = {
  id: string;
  hand_id: string;
  user_id: string;
  config: HandConfig;
  events: TimelineEvent[];
  title: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  saved_at: string | null;
  final_street: HandRecord["final_street"];
  total_pot_chips: number | null;
  button_seat: number;
  is_shared?: boolean | null;
  share_token?: string | null;
};

type HandUpdatePayload = {
  title?: string | null;
  tags?: string[] | null;
  config?: HandConfig;
  events?: TimelineEvent[];
  final_street?: HandRecord["final_street"];
  total_pot_chips?: number;
  button_seat?: number;
};

/**
 * 핸드를 DB에 저장
 */
export async function saveHand(input: SaveHandInput): Promise<HandRecord> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to save a hand");
  }

  // 이벤트를 재생해서 최종 상태 계산
  const finalState = replayToCursor(input.events, input.events.length);
  const finalStreet = finalState.street;

  // 실제 팟 계산: computePots를 사용하고 언콜드 베트를 제외
  const potComputed = computePots({
    config: input.config,
    eventsApplied: input.events,
  });

  // 핸드가 끝났으므로 roundClosed: true로 설정하여 언콜드 베트 제외
  const refunded = applyUncalledRefund(potComputed.pots, {
    roundClosed: true,
  });

  // 실제 팟은 언콜드 베트를 제외한 pots의 합계
  const totalPotChips = refunded.pots.reduce((sum, pot) => sum + pot.amount, 0);

  // DB에 저장
  const { data, error } = await supabase
    .from("hands")
    .insert({
      hand_id: input.handId,
      user_id: user.id,
      config: input.config,
      events: input.events,
      button_seat: input.buttonSeat,
      title: input.title || null,
      tags: input.tags || null,
      final_street: finalStreet,
      total_pot_chips: totalPotChips,
      saved_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save hand: ${error.message}`);
  }

  return mapDbRecordToHandRecord(data);
}

/**
 * 핸드를 DB에서 로드
 */
export async function loadHand(handId: string): Promise<HandRecord | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to load a hand");
  }

  const { data, error } = await supabase
    .from("hands")
    .select("*")
    .eq("hand_id", handId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to load hand: ${error.message}`);
  }

  return mapDbRecordToHandRecord(data);
}

/**
 * 공유 토큰으로 핸드 로드 (비로그인 포함)
 */
export async function loadSharedHandByToken(
  shareToken: string,
): Promise<HandRecord | null> {
  const { data, error } = await supabase
    .from("hands")
    .select("*")
    .eq("share_token", shareToken)
    .eq("is_shared", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to load shared hand: ${error.message}`);
  }

  return mapDbRecordToHandRecord(data);
}

/**
 * 핸드 공유 활성화 (토큰 생성 또는 재사용)
 */
export async function enableHandShare(handId: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to share a hand");
  }

  const { data: hand, error: handError } = await supabase
    .from("hands")
    .select("id, share_token")
    .eq("hand_id", handId)
    .eq("user_id", user.id)
    .single();

  if (handError) {
    throw new Error(`Failed to find hand for sharing: ${handError.message}`);
  }

  if (hand.share_token) {
    const { error: updateError } = await supabase
      .from("hands")
      .update({ is_shared: true })
      .eq("id", hand.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(`Failed to enable hand sharing: ${updateError.message}`);
    }

    return hand.share_token;
  }

  // 고유 토큰 충돌 가능성은 매우 낮지만, 충돌 시 재시도
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = nanoid(18);
    const { data: updated, error: updateError } = await supabase
      .from("hands")
      .update({
        is_shared: true,
        share_token: token,
      })
      .eq("id", hand.id)
      .eq("user_id", user.id)
      .select("share_token")
      .single();

    if (!updateError) {
      return updated.share_token as string;
    }

    if (updateError.code !== "23505") {
      throw new Error(`Failed to generate share token: ${updateError.message}`);
    }
  }

  throw new Error("Failed to generate a unique share token");
}

/**
 * 사용자의 핸드 목록 조회
 */
export async function listHands(options?: {
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "updated_at" | "saved_at";
  orderDirection?: "asc" | "desc";
}): Promise<HandRecord[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to list hands");
  }

  const {
    limit = 50,
    offset = 0,
    orderBy = "created_at",
    orderDirection = "desc",
  } = options || {};

  const query = supabase
    .from("hands")
    .select("*")
    .eq("user_id", user.id)
    .order(orderBy, { ascending: orderDirection === "asc" })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list hands: ${error.message}`);
  }

  return (data || []).map(mapDbRecordToHandRecord);
}

/**
 * 핸드 업데이트
 */
export async function updateHand(
  handId: string,
  input: UpdateHandInput
): Promise<HandRecord> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to update a hand");
  }

  // 업데이트할 데이터 준비
  const updateData: HandUpdatePayload = {};

  if (input.title !== undefined) {
    updateData.title = input.title || null;
  }
  if (input.tags !== undefined) {
    updateData.tags = input.tags || null;
  }
  if (input.config !== undefined) {
    updateData.config = input.config;
  }
  if (input.events !== undefined) {
    updateData.events = input.events;
    // 이벤트가 업데이트되면 최종 상태도 재계산
    const finalState = replayToCursor(input.events, input.events.length);
    updateData.final_street = finalState.street;

    // 실제 팟 계산: config가 제공되지 않으면 기존 핸드에서 가져오기
    let configForPot = input.config;
    if (!configForPot) {
      const existingHand = await loadHand(handId);
      if (!existingHand) {
        throw new Error("Hand not found");
      }
      configForPot = existingHand.config;
    }

    // 실제 팟 계산: computePots를 사용하고 언콜드 베트를 제외
    const potComputed = computePots({
      config: configForPot,
      eventsApplied: input.events,
    });

    // 핸드가 끝났으므로 roundClosed: true로 설정하여 언콜드 베트 제외
    const refunded = applyUncalledRefund(potComputed.pots, {
      roundClosed: true,
    });

    // 실제 팟은 언콜드 베트를 제외한 pots의 합계
    updateData.total_pot_chips = refunded.pots.reduce(
      (sum, pot) => sum + pot.amount,
      0
    );
  }
  if (input.buttonSeat !== undefined) {
    updateData.button_seat = input.buttonSeat;
  }

  const { data, error } = await supabase
    .from("hands")
    .update(updateData)
    .eq("hand_id", handId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update hand: ${error.message}`);
  }

  return mapDbRecordToHandRecord(data);
}

/**
 * 핸드 삭제
 */
export async function deleteHand(handId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to delete a hand");
  }

  const { error } = await supabase
    .from("hands")
    .delete()
    .eq("hand_id", handId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Failed to delete hand: ${error.message}`);
  }
}

/**
 * DB 레코드를 HandRecord 타입으로 변환
 */
function mapDbRecordToHandRecord(dbRecord: HandDbRow): HandRecord {
  return {
    id: dbRecord.id,
    hand_id: dbRecord.hand_id,
    user_id: dbRecord.user_id,
    config: dbRecord.config as HandConfig,
    events: dbRecord.events as TimelineEvent[],
    title: dbRecord.title,
    tags: dbRecord.tags,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
    saved_at: dbRecord.saved_at,
    final_street: dbRecord.final_street,
    total_pot_chips: dbRecord.total_pot_chips,
    button_seat: dbRecord.button_seat,
    is_shared: dbRecord.is_shared ?? false,
    share_token: dbRecord.share_token ?? null,
  };
}
