"use client";

import { type FormEvent } from "react";
import {
  ArrowRight,
  Users,
  Dices,
  Info,
  Wallet,
  SlidersHorizontal,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { GameType, AnteMode } from "@/features/hand/domain/handConfig";
import { useSetupLogic } from "@/features/hand/editor/hooks/useSetupLogic";
import { useTranslations } from "next-intl";

export function SetupCard() {
  const t = useTranslations("handFlow.setup");
  const { state, actions } = useSetupLogic();
  const isBbAnteMode = state.anteMode === "BB_ANTE";

  const blindPresets =
    state.gameType === "CASH"
      ? [
          { sb: 0.25, bb: 0.5, label: "0.25 / 0.5" },
          { sb: 0.5, bb: 1, label: "0.5 / 1" },
          { sb: 1, bb: 2, label: "1 / 2" },
          { sb: 2, bb: 5, label: "2 / 5" },
          { sb: 5, bb: 10, label: "5 / 10" },
        ]
      : [
          { sb: 100, bb: 200, label: "100 / 200" },
          { sb: 250, bb: 500, label: "250 / 500" },
          { sb: 500, bb: 1000, label: "500 / 1000" },
          { sb: 1000, bb: 2000, label: "1000 / 2000" },
        ];
  const stackPresets = [50, 100, 150, 200];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actions.handleNextStep();
  };

  return (
    <Card className="h-full overflow-hidden rounded-[1.5rem] border-border bg-card/55 p-0.5 shadow-xl backdrop-blur-xl md:rounded-[2rem]">
      <form
        className="h-full space-y-4 overflow-y-auto overscroll-contain p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:space-y-3 md:p-5 md:pb-5 lg:space-y-2.5 lg:p-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              id="setup-game-type-label"
              className="ml-1 flex items-center gap-2 text-[13px] font-semibold text-muted-foreground"
            >
              <Dices className="h-3.5 w-3.5 text-primary/80" />{" "}
              {t("gameTypeLabel")}
            </label>
            <Select
              value={state.gameType}
              onValueChange={(v) => actions.setGameType(v as GameType)}
            >
              <SelectTrigger
                aria-labelledby="setup-game-type-label"
                className="h-11 w-full rounded-xl border-border bg-background/50 transition-colors focus:ring-1 focus:ring-primary/40 md:h-10"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover">
                <SelectItem value="CASH">{t("gameTypeCash")}</SelectItem>
                <SelectItem value="TOURNAMENT">
                  {t("gameTypeTournament")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              id="setup-max-players-label"
              className="ml-1 flex items-center gap-2 text-[13px] font-semibold text-muted-foreground"
            >
              <Users className="h-3.5 w-3.5 text-primary/80" />{" "}
              {t("maxPlayersLabel")}
            </label>
            <Select
              value={state.values.maxPlayers}
              onValueChange={(val) =>
                actions.handleNumberChange("maxPlayers", val)
              }
            >
              <SelectTrigger
                aria-labelledby="setup-max-players-label"
                className="h-11 w-full rounded-xl border-border bg-background/50 transition-colors focus:ring-1 focus:ring-primary/40 md:h-10"
              >
                <SelectValue placeholder={t("selectPlayersPlaceholder")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <SelectItem
                    key={num}
                    value={num.toString()}
                    className="rounded-lg"
                  >
                    {t("playersOption", { count: num })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="setup-small-blind"
                className="ml-1 flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground md:text-[13px]"
              >
                <span className="text-[10px] font-black uppercase tracking-wide text-primary">
                  SB
                </span>
                {t("smallBlindLabel")}
              </label>
              <div className="relative">
                <Input
                  id="setup-small-blind"
                  required
                  inputMode={state.gameType === "CASH" ? "decimal" : "numeric"}
                  value={state.values.smallBlind}
                  onChange={(e) =>
                    actions.handleNumberChange("smallBlind", e.target.value)
                  }
                  placeholder={
                    state.gameType === "CASH"
                      ? t("smallBlindPlaceholderCash")
                      : t("smallBlindPlaceholderTournament")
                  }
                  aria-invalid={Boolean(state.errors.smallBlind)}
                  aria-describedby={
                    state.errors.smallBlind
                      ? "setup-small-blind-error"
                      : undefined
                  }
                  className="h-11 rounded-xl border-border bg-background/50 pr-12 md:h-10 lg:h-9"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                  {state.unit}
                </span>
              </div>
              {state.errors.smallBlind ? (
                <p
                  id="setup-small-blind-error"
                  role="alert"
                  className="ml-1 text-[11px] font-medium text-destructive"
                >
                  {state.errors.smallBlind}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="setup-big-blind"
                className="ml-1 flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground md:text-[13px]"
              >
                <span className="text-[10px] font-black uppercase tracking-wide text-primary">
                  BB
                </span>
                {t("bigBlindLabel")}
              </label>
              <div className="relative">
                <Input
                  id="setup-big-blind"
                  required
                  inputMode={state.gameType === "CASH" ? "decimal" : "numeric"}
                  value={state.values.bigBlind}
                  onChange={(e) =>
                    actions.handleNumberChange("bigBlind", e.target.value)
                  }
                  placeholder={
                    state.gameType === "CASH"
                      ? t("bigBlindPlaceholderCash")
                      : t("bigBlindPlaceholderTournament")
                  }
                  aria-invalid={Boolean(state.errors.bigBlind)}
                  aria-describedby={
                    state.errors.bigBlind ? "setup-big-blind-error" : undefined
                  }
                  className="h-11 rounded-xl border-border bg-background/50 pr-12 md:h-10 lg:h-9"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                  {state.unit}
                </span>
              </div>
              {state.errors.bigBlind ? (
                <p
                  id="setup-big-blind-error"
                  role="alert"
                  className="ml-1 text-[11px] font-medium text-destructive"
                >
                  {state.errors.bigBlind}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2 pt-0.5">
            <p className="ml-1 text-[11px] font-semibold text-muted-foreground">
              {t("quickBlindsLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {blindPresets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => actions.applyBlindPreset(preset.sb, preset.bb)}
                  className="h-7 rounded-full border border-border/70 bg-background/65 px-2.5 text-[11px] font-semibold text-foreground hover:bg-muted/70"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="space-y-3">
          <div className="space-y-2">
            <label
              htmlFor="setup-average-stack"
              className="ml-1 flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground md:text-[13px]"
            >
              <Wallet className="h-3.5 w-3.5 text-primary/80" />
              {t("averageStackLabel")}
            </label>
            <div className="relative">
                <Input
                  id="setup-average-stack"
                inputMode={state.gameType === "CASH" ? "decimal" : "numeric"}
                value={state.values.avgStacks}
                onChange={(e) =>
                  actions.handleNumberChange("avgStacks", e.target.value)
                }
                placeholder={
                  state.gameType === "CASH"
                    ? t("averageStackPlaceholderCash")
                    : t("averageStackPlaceholderTournament")
                }
                aria-invalid={Boolean(state.errors.avgStacks)}
                aria-describedby={
                  state.errors.avgStacks
                    ? "setup-average-stack-error"
                    : undefined
                }
                className="h-11 rounded-xl border-border bg-background/50 pr-28 md:h-10 md:pr-32 lg:h-9"
              />
              <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1.5 md:gap-2">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-black whitespace-nowrap text-primary">
                  {actions.calculateBB()} BB
                </span>
                <span className="pr-1 text-[10px] font-bold text-muted-foreground">
                  {state.unit}
                </span>
              </div>
            </div>
            {state.errors.avgStacks ? (
              <p
                id="setup-average-stack-error"
                role="alert"
                className="ml-1 text-[11px] font-medium text-destructive"
              >
                {state.errors.avgStacks}
              </p>
            ) : (
              <p className="ml-1 text-[11px] text-muted-foreground">
                {t("averageStackHint")}
              </p>
            )}
          </div>
          <div className="space-y-2 pt-0.5">
            <p className="ml-1 text-[11px] font-semibold text-muted-foreground">
              {t("quickStacksLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {stackPresets.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => actions.applyStackPreset(preset)}
                  className="h-7 rounded-full border border-border/70 bg-background/65 px-2.5 text-[11px] font-semibold text-foreground hover:bg-muted/70"
                >
                  {t("presetBb", { count: preset })}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-2">
              <label
                id="setup-ante-mode-label"
                className="ml-1 flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground md:text-[13px]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary/80" />
                {t("anteModeLabel")}
              </label>
              <Select
                value={state.anteMode}
                onValueChange={(v) => actions.setAnteMode(v as AnteMode)}
              >
                <SelectTrigger
                  aria-labelledby="setup-ante-mode-label"
                  className="h-11 rounded-xl border-border bg-background/50 md:h-10"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  <SelectItem value="NONE">{t("anteModeNone")}</SelectItem>
                  <SelectItem value="ANTE">
                    {t("anteModeIndividual")}
                  </SelectItem>
                  <SelectItem value="BB_ANTE">{t("anteModeBbAnte")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="setup-ante-amount"
                className="ml-1 flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground md:text-[13px]"
              >
                <CircleDollarSign className="h-3.5 w-3.5 text-primary/80" />
                {t("anteAmountLabel")}
              </label>
              <div className="relative">
                <Input
                  id="setup-ante-amount"
                  inputMode={state.gameType === "CASH" ? "decimal" : "numeric"}
                  value={state.values.anteAmount}
                  onChange={(e) =>
                    actions.handleNumberChange("anteAmount", e.target.value)
                  }
                  placeholder={
                    state.gameType === "CASH"
                      ? t("anteAmountPlaceholderCash")
                      : t("anteAmountPlaceholderTournament")
                  }
                  disabled={state.anteMode === "NONE"}
                  readOnly={isBbAnteMode}
                  aria-invalid={Boolean(state.errors.anteAmount)}
                  aria-describedby={
                    state.errors.anteAmount
                      ? "setup-ante-amount-error"
                      : undefined
                  }
                  className="h-11 rounded-xl border-border bg-background/50 pr-12 disabled:bg-muted/55 disabled:text-muted-foreground read-only:cursor-default read-only:bg-muted/45 read-only:text-muted-foreground read-only:focus-visible:ring-0 read-only:focus-visible:border-border md:h-10 lg:h-9"
                />
                {state.anteMode !== "NONE" ? (
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                    {state.unit}
                  </span>
                ) : null}
              </div>
              {state.errors.anteAmount ? (
                <p
                  id="setup-ante-amount-error"
                  role="alert"
                  className="ml-1 text-[11px] font-medium text-destructive"
                >
                  {state.errors.anteAmount}
                </p>
              ) : state.anteMode === "NONE" ? (
                <p className="ml-1 text-[11px] text-muted-foreground">
                  {t("anteDisabledHint")}
                </p>
              ) : isBbAnteMode ? (
                <p className="ml-1 text-[11px] text-muted-foreground">
                  {t("bbAnteReadonlyHint")}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-3 text-[12px] text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="leading-relaxed">{t("bottomInfo")}</p>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={!state.values.smallBlind || !state.values.bigBlind}
          className="group h-12 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.98] md:h-11"
          size="lg"
        >
          {t("nextButton")}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>
    </Card>
  );
}
