import { useMemo } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getChipStack } from "@/features/hand/ui/assets";
import { MAX_CHIPS_PER_STACK } from "@/features/hand/ui/constants";
import { useTranslations } from "next-intl";

export const ChipStack = ({
  amount,
  className,
  bb,
}: {
  amount: number;
  className?: string;
  bb: number;
}) => {
  const t = useTranslations("handFlow.table");
  const allChips = useMemo(() => getChipStack(amount), [amount]);

  // 5개씩 묶어서 스택 분리 (가로로 나열하기 위함)
  const chipStacks = useMemo(() => {
    const stacks = [];
    for (let i = 0; i < allChips.length; i += MAX_CHIPS_PER_STACK) {
      stacks.push(allChips.slice(i, i + MAX_CHIPS_PER_STACK));
    }
    return stacks;
  }, [allChips]);

  // 소수점 값도 표시하기 위해 amount > 0이면 표시 (allChips.length === 0 체크 제거)
  if (!amount || amount <= 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center pointer-events-none",
        className
      )}
    >
      <div className="flex items-end">
        {chipStacks.map((stack, stackIdx) => (
          <div
            key={`stack-${stackIdx}`}
            className="relative w-5 sm:w-5 md:w-5 transition-all"
            style={{ height: `${24 + (stack.length - 1) * 4}px` }} // 높이 동적 계산
          >
            {stack.map((src, chipIdx) => (
              <div
                key={`chip-${stackIdx}-${chipIdx}`}
                className="absolute left-0.5 w-4 h-4 md:w-5 md:h-5 drop-shadow-md"
                style={{
                  bottom: `${chipIdx * 2.5}px`, // 칩을 위로 쌓는 간격
                  zIndex: stackIdx * 10 + chipIdx,
                }}
              >
                <Image
                  src={src}
                  alt="chip"
                  // 칩은 개수가 많으므로 서버 최적화 과정을 생략하고
                  // 캐시된 이미지를 즉시 렌더링하도록 unoptimized 설정
                  width={20}
                  height={20}
                  unoptimized
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 금액 표시 뱃지 */}
      <span className="text-[12px] font-semibold text-white bg-black/60 px-2 py-[1px] rounded-full z-20 whitespace-nowrap">
        {amount / bb} {t("bbUnit")}
      </span>
    </div>
  );
};
