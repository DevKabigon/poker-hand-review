"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

const GRID_SIZE = 40;
const GRID_SPEED_PX_PER_SEC = 16;
const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

export function GlobalMovingGridBackground() {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);
  const frameAccumulatorRef = useRef(0);

  useEffect(() => {
    const setCenter = () => {
      mouseX.set(window.innerWidth * 0.5);
      mouseY.set(window.innerHeight * 0.45);
    };

    let rafId: number | null = null;
    let pendingX = 0;
    let pendingY = 0;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      pendingX = event.clientX;
      pendingY = event.clientY;

      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        mouseX.set(pendingX);
        mouseY.set(pendingY);
        rafId = null;
      });
    };

    setCenter();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("resize", setCenter);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", setCenter);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [mouseX, mouseY]);

  useAnimationFrame((_, delta) => {
    if (prefersReducedMotion) return;

    frameAccumulatorRef.current += delta;
    if (frameAccumulatorRef.current < FRAME_INTERVAL_MS) return;

    const elapsedMs = frameAccumulatorRef.current;
    frameAccumulatorRef.current = 0;
    const step = (GRID_SPEED_PX_PER_SEC * elapsedMs) / 1000;

    const nextX = (gridOffsetX.get() + step) % GRID_SIZE;
    const nextY = (gridOffsetY.get() + step) % GRID_SIZE;
    gridOffsetX.set(nextX);
    gridOffsetY.set(nextY);
  });

  const spotlightMask = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.2]">
        <GridPattern id="global-grid-base" offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </div>

      <motion.div
        className="absolute inset-0 opacity-[0.72]"
        style={{ maskImage: spotlightMask, WebkitMaskImage: spotlightMask }}
      >
        <GridPattern id="global-grid-active" offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </motion.div>

      <div className="absolute inset-0 bg-linear-to-b from-background/8 via-background/14 to-background/30" />
      <div className="absolute -top-28 right-[-12%] h-[22rem] w-[22rem] rounded-full bg-primary/26 blur-[120px]" />
      <div className="absolute -bottom-36 left-[-14%] h-[24rem] w-[24rem] rounded-full bg-chart-2/22 blur-[125px]" />
      <div className="absolute right-[28%] top-[-20%] h-[18rem] w-[18rem] rounded-full bg-primary/20 blur-[110px]" />
    </div>
  );
}

function GridPattern({
  id,
  offsetX,
  offsetY,
}: {
  id: string;
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
}) {
  return (
    <svg className="h-full w-full">
      <defs>
        <motion.pattern
          id={id}
          width={GRID_SIZE}
          height={GRID_SIZE}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="text-foreground/60"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
