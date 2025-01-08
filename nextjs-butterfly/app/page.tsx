"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import KeyboardListener from "./game/systems/KeyboardListener";
import { Level } from "./game/worlds/Level";

// initialize the pixi application
// and make a full screen view
async function initPixiApp(canvas: HTMLCanvasElement) {
  const app = new PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>();
  await app.init({
    view: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xffffff,
  });

  const beeAssets = {
    body: await loadSvg("bee_body.svg"),
    leftWing: await loadSvg("bee_wing_left.svg"),
    rightWing: await loadSvg("bee_wing_right.svg"),
  };
  const cloudAssets = [await loadSvg("cloud1.svg")];

  return { app, beeAssets, cloudAssets };
}

async function loadSvg(src: string) {
  return await PIXI.Assets.load({
    src: src,
    data: { parseAsGraphicsContext: true },
  });
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let pixiApp: undefined | PIXI.Application = undefined;
    let controller: undefined | KeyboardListener = undefined;

    if (canvasRef.current) {
      initPixiApp(canvasRef.current).then(({ app, beeAssets, cloudAssets }) => {
        pixiApp = app;
        controller = new KeyboardListener();
        const level = new Level(app, beeAssets, cloudAssets);
        app.ticker.add(() => level.update());
      });

      return () => {
        controller?.destroy();
        pixiApp?.destroy(true, { children: true, texture: true });
      };
    }
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="w-screen h-screen absolute top-0 left-0 z-[-1]">
          <canvas ref={canvasRef} className="w-screen h-screen" />
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
    </div>
  );
}
