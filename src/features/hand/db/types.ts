// src/features/hand/db/types.ts

import type { HandConfig } from "../domain/handConfig";
import type { TimelineEvent } from "../domain/events";
import type { Street } from "../engine/reducer";

/**
 * DB에 저장된 핸드 레코드 타입
 */
export type HandRecord = {
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
  final_street: Street | null;
  total_pot_chips: number | null;
  button_seat: number;
  is_shared: boolean;
  share_token: string | null;
};

/**
 * 핸드 저장 시 입력 데이터 타입
 */
export type SaveHandInput = {
  handId: string;
  config: HandConfig;
  events: TimelineEvent[];
  buttonSeat: number;
  title?: string;
  tags?: string[];
};

/**
 * 핸드 업데이트 시 입력 데이터 타입
 */
export type UpdateHandInput = {
  title?: string;
  tags?: string[];
  config?: HandConfig;
  events?: TimelineEvent[];
  buttonSeat?: number;
};
