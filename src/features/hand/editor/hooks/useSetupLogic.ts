import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHandEditorStore } from "@/features/hand/editor/handEditorStore";
import {
  AnteMode,
  GameType,
  HandConfig,
  PlayerConfig,
  SeatIndex,
} from "@/features/hand/domain/handConfig";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type SetupField = "smallBlind" | "bigBlind" | "avgStacks" | "anteAmount";
type SetupValues = {
  maxPlayers: string;
  smallBlind: string;
  bigBlind: string;
  anteAmount: string;
  avgStacks: string;
};
type SetupErrors = Partial<Record<SetupField, string>>;
const INITIAL_GAME_TYPE: GameType = "TOURNAMENT";
const INITIAL_ANTE_MODE: AnteMode = "BB_ANTE";

const defaultValuesByGameType: Record<
  GameType,
  Pick<SetupValues, "smallBlind" | "bigBlind" | "avgStacks" | "anteAmount">
> = {
  CASH: {
    smallBlind: "0.25",
    bigBlind: "0.50",
    avgStacks: "50.00",
    anteAmount: "0.50",
  },
  TOURNAMENT: {
    smallBlind: "100",
    bigBlind: "200",
    avgStacks: "10000",
    anteAmount: "200",
  },
};

export function useSetupLogic() {
  const t = useTranslations("handFlow.setup");
  const params = useParams();
  const router = useRouter();

  const { config, setConfig } = useHandEditorStore();
  const reset = useHandEditorStore((s) => s.reset);

  const [gameType, setGameType] = useState<GameType>(INITIAL_GAME_TYPE);
  const [anteMode, setAnteMode] = useState<AnteMode>(INITIAL_ANTE_MODE);
  const [values, setValues] = useState<SetupValues>({
    maxPlayers: "6",
    smallBlind: defaultValuesByGameType[INITIAL_GAME_TYPE].smallBlind,
    bigBlind: defaultValuesByGameType[INITIAL_GAME_TYPE].bigBlind,
    anteAmount:
      INITIAL_ANTE_MODE === "NONE"
        ? ""
        : defaultValuesByGameType[INITIAL_GAME_TYPE].anteAmount,
    avgStacks: defaultValuesByGameType[INITIAL_GAME_TYPE].avgStacks,
  });
  const [errors, setErrors] = useState<SetupErrors>({});

  const clearErrors = (fields: SetupField[]) => {
    setErrors((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const field of fields) {
        if (next[field]) {
          delete next[field];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  };

  const formatNumberForGame = (value: number) => {
    if (!Number.isFinite(value)) return "";
    if (gameType === "TOURNAMENT") return Math.round(value).toString();
    return value.toFixed(2).replace(/\.?0+$/, "");
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  // 데이터 복구 로직
  useEffect(() => {
    if (config) {
      setGameType(config.gameType);
      setAnteMode(config.blinds.anteMode);
      setValues({
        maxPlayers: config.maxPlayers.toString(),
        smallBlind: config.blinds.sb.toString(),
        bigBlind: config.blinds.bb.toString(),
        anteAmount:
          config.blinds.anteMode === "NONE"
            ? ""
            : config.blinds.anteMode === "BB_ANTE"
              ? config.blinds.bb.toString()
              : config.blinds.anteAmount?.toString() ?? "",
        avgStacks: config.players[0]?.stack.toString() || "",
      });
      setErrors({});
    }
  }, [config]);

  useEffect(() => {
    if (anteMode !== "BB_ANTE") return;
    setValues((prev) => {
      if (prev.anteAmount === prev.bigBlind) return prev;
      return { ...prev, anteAmount: prev.bigBlind };
    });
    clearErrors(["anteAmount"]);
  }, [anteMode, values.bigBlind]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const calculateBB = () => {
    const stacks = parseFloat(values.avgStacks);
    const bb = parseFloat(values.bigBlind);
    if (isNaN(stacks) || isNaN(bb) || bb === 0) return "0";
    return (stacks / bb).toFixed(1);
  };

  const handleNumberChange = (key: keyof SetupValues, val: string) => {
    let cleanValue = val;
    if (key === "maxPlayers") {
      cleanValue = val.replace(/[^0-9]/g, "");
      if (parseInt(cleanValue) > 10) cleanValue = "10";
    } else {
      cleanValue = val.replace(/[^0-9.]/g, "");
      if (gameType === "CASH") {
        const parts = cleanValue.split(".");
        if (parts.length > 2)
          cleanValue = parts[0] + "." + parts.slice(1).join("");
      } else {
        cleanValue = val.replace(/[^0-9]/g, "");
      }
    }
    const nextValue = cleanValue.slice(0, 10);
    setValues((prev) => ({
      ...prev,
      [key]: nextValue,
      ...(key === "bigBlind" && anteMode === "BB_ANTE"
        ? { anteAmount: nextValue }
        : {}),
    }));

    if (key === "smallBlind" || key === "bigBlind") {
      clearErrors(
        key === "bigBlind" && anteMode === "BB_ANTE"
          ? ["smallBlind", "bigBlind", "anteAmount"]
          : ["smallBlind", "bigBlind"]
      );
      return;
    }
    if (key !== "maxPlayers") {
      clearErrors([key]);
    }
  };

  const validateValues = (): SetupErrors => {
    const nextErrors: SetupErrors = {};
    const sbRaw = values.smallBlind.trim();
    const bbRaw = values.bigBlind.trim();
    const avgRaw = values.avgStacks.trim();
    const anteRaw = values.anteAmount.trim();

    const sbValue = Number(sbRaw);
    const bbValue = Number(bbRaw);

    if (!sbRaw) nextErrors.smallBlind = t("errorRequired");
    else if (!Number.isFinite(sbValue) || sbValue <= 0) {
      nextErrors.smallBlind = t("errorMustBePositive");
    }

    if (!bbRaw) nextErrors.bigBlind = t("errorRequired");
    else if (!Number.isFinite(bbValue) || bbValue <= 0) {
      nextErrors.bigBlind = t("errorMustBePositive");
    }

    if (
      !nextErrors.smallBlind &&
      !nextErrors.bigBlind &&
      sbValue >= bbValue
    ) {
      nextErrors.bigBlind = t("errorSmallBlindMustBeLess");
    }

    if (avgRaw) {
      const avgValue = Number(avgRaw);
      if (!Number.isFinite(avgValue) || avgValue <= 0) {
        nextErrors.avgStacks = t("errorMustBePositive");
      }
    }

    if (anteMode === "ANTE") {
      if (!anteRaw) nextErrors.anteAmount = t("errorAnteRequired");
      else {
        const anteValue = Number(anteRaw);
        if (!Number.isFinite(anteValue) || anteValue <= 0) {
          nextErrors.anteAmount = t("errorMustBePositive");
        }
      }
    }

    return nextErrors;
  };

  const handleGameTypeChange = (nextGameType: GameType) => {
    setGameType(nextGameType);
    clearErrors(["smallBlind", "bigBlind", "avgStacks", "anteAmount"]);
    const nextAnteMode: AnteMode =
      nextGameType === "CASH"
        ? "NONE"
        : anteMode === "NONE"
          ? "BB_ANTE"
          : anteMode;
    setAnteMode(nextAnteMode);
    const nextDefaults = defaultValuesByGameType[nextGameType];
    setValues((prev) => ({
      ...prev,
      smallBlind: nextDefaults.smallBlind,
      bigBlind: nextDefaults.bigBlind,
      avgStacks: nextDefaults.avgStacks,
      anteAmount:
        nextAnteMode === "NONE"
          ? ""
          : nextAnteMode === "BB_ANTE"
            ? nextDefaults.bigBlind
            : nextDefaults.anteAmount,
    }));
  };

  const handleAnteModeChange = (nextAnteMode: AnteMode) => {
    setAnteMode(nextAnteMode);
    setValues((prev) => ({
      ...prev,
      anteAmount:
        nextAnteMode === "NONE"
          ? ""
          : nextAnteMode === "BB_ANTE"
            ? prev.bigBlind
            : prev.anteAmount || defaultValuesByGameType[gameType].anteAmount,
    }));
    clearErrors(["anteAmount"]);
  };

  const applyBlindPreset = (sb: number, bb: number) => {
    const nextSb = formatNumberForGame(sb);
    const nextBb = formatNumberForGame(bb);
    setValues((prev) => ({
      ...prev,
      smallBlind: nextSb,
      bigBlind: nextBb,
      ...(anteMode === "BB_ANTE" ? { anteAmount: nextBb } : {}),
    }));
    clearErrors(
      anteMode === "BB_ANTE"
        ? ["smallBlind", "bigBlind", "anteAmount"]
        : ["smallBlind", "bigBlind"]
    );
  };

  const applyStackPreset = (bbMultiple: number) => {
    const bbValue = Number(values.bigBlind);
    if (!Number.isFinite(bbValue) || bbValue <= 0) {
      setErrors((prev) => ({ ...prev, bigBlind: t("errorRequired") }));
      toast(t("stackPresetNeedsBb"));
      return;
    }

    setValues((prev) => ({
      ...prev,
      avgStacks: formatNumberForGame(bbValue * bbMultiple),
    }));
    clearErrors(["avgStacks"]);
  };

  const handleNextStep = () => {
    const nextErrors = validateValues();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error(t("errorCheckInput"));
      return;
    }

    reset({ keepSetup: false });
    const numPlayers = parseInt(values.maxPlayers);
    const sbValue = parseFloat(values.smallBlind || "0");
    const bbValue = parseFloat(values.bigBlind || "0");
    const avgStackValue = parseFloat(values.avgStacks || "0");

    const initialPlayers: PlayerConfig[] = Array.from(
      { length: numPlayers },
      (_, i) => ({
        seat: i as SeatIndex,
        name: t("defaultPlayerName", { index: i + 1 }),
        stack: avgStackValue > 0 ? avgStackValue : bbValue * 100,
        isHero: i === 0,
        // 튜플 구조에 맞게 null 2개로 초기화
        holdCards: [null, null],
      })
    );

    const configData: HandConfig = {
      gameType,
      maxPlayers: numPlayers,
      blinds: {
        sb: sbValue,
        bb: bbValue,
        anteMode,
        anteAmount:
          anteMode === "NONE"
            ? 0
            : anteMode === "BB_ANTE"
              ? bbValue
              : parseFloat(values.anteAmount || "0"),
      },
      players: initialPlayers,
    };

    try {
      setConfig(configData);
      router.push(`/hands/${params.handId}/players`);
    } catch (error) {
      toast.error(t("errorCheckInput"));
      console.error(error);
    }
  };

  return {
    state: {
      gameType,
      anteMode,
      values,
      errors,
      unit: gameType === "CASH" ? "$" : t("unitChips"),
    },
    actions: {
      setGameType: handleGameTypeChange,
      setAnteMode: handleAnteModeChange,
      handleNumberChange,
      handleNextStep,
      calculateBB,
      applyBlindPreset,
      applyStackPreset,
    },
  };
}
