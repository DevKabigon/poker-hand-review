import type { ActionType } from "@/features/hand/domain/events";
import type { Street } from "@/features/hand/engine/reducer";

export type LegalAction = ActionType;

export type LegalActionContext = {
  street: Street;
  hasBetToCall: boolean;
  canReopenBetting: boolean;
};

export function getLegalActions(ctx: LegalActionContext): LegalAction[] {
  const { street, hasBetToCall, canReopenBetting } = ctx;

  // ✅ 콜할 게 있으면(베팅을 마주침) → 폴드 가능
  if (hasBetToCall) {
    return canReopenBetting
      ? ["FOLD", "CALL", "RAISE", "ALL_IN"]
      : ["FOLD", "CALL", "ALL_IN"];
  }

  // ✅ 콜할 게 없으면(체크 가능 라인) → 폴드 불가
  if (street === "PREFLOP") return ["CHECK", "RAISE", "ALL_IN"];

  return ["CHECK", "BET", "ALL_IN"];
}
