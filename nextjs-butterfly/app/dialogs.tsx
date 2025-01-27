"use client";
import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Level } from "./game/worlds/Level";
import { initEngine } from "./game/systems/AudioSystem";
import { updateGameState } from "./game/systems/movementSystem";
import Image from "next/image";
import { AllAssets } from "./page";

export type DialogState =
  | "start"
  | "paused"
  | "gameover"
  | "level"
  | "settings"
  | "none";

const levelSettingList = [
  { level: 1, bees: 3, flowers: 10, butterflies: 3 },
  { level: 2, bees: 5, flowers: 10, butterflies: 4 },
  { level: 3, bees: 7, flowers: 15, butterflies: 5 },
  { level: 4, bees: 9, flowers: 18, butterflies: 8 },
  { level: 5, bees: 20, flowers: 25, butterflies: 5 },
  { level: 6, bees: 30, flowers: 35, butterflies: 5 },
];

export function GameDialog({
  app,
  assets,
}: {
  app: PIXI.Application;
  assets: AllAssets;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const [dialogState, setDialogState] = useState<DialogState>("start");
  const [levelNro, setLevelNro] = useState<number>(0);
  const [level, setLevel] = useState<Level | undefined>(undefined);
  const [totalRescued, setTotalRescued] = useState<number>(0);

  useEffect(() => {
    if (dialogState === "level") {
      setTotalRescued(totalRescued + levelSettingList[levelNro].butterflies);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogState]);

  function startLevelWithNro(nro: number) {
    if (level) {
      app.ticker.remove(() => level.update());
    }
    updateGameState({
      setDialogState: setDialogState,
      dialogState: "none",
      showDialog: false,
    });

    const newLevel = new Level(app, assets, levelSettingList[nro]);
    app.ticker.add(() => newLevel.update());
    setTimeout(() => updateGameState({ paused: false }), 200);
    setDialogState("none");
    setLevel(newLevel);
    setLevelNro(nro);
  }

  const start = async () => {
    startLevelWithNro(0);
  };

  const nextLevel = () => {
    let newLevelNro = levelNro + 1;
    if (newLevelNro > levelSettingList.length - 1) {
      newLevelNro = 0;
    }
    startLevelWithNro(newLevelNro);
  };

  if (dialogState === "none") {
    return null;
  }
  return (
    <div className="fixed top-0 left-0 w-screen h-screen     bg-gradient-to-br from-green-400 to-green-800">
      <div
        ref={dialogRef}
        className="mainDialog absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        {dialogState === "start" && <StartDialog start={start} />}
        {dialogState === "paused" && <PausedDialog />}
        {dialogState === "gameover" && (
          <GameOverDialog setDialogState={setDialogState} />
        )}
        {dialogState === "level" && (
          <LevelDialog
            completedLevelNro={levelNro}
            nextLevel={nextLevel}
            totalRescued={totalRescued}
          />
        )}
        {dialogState === "settings" && (
          <SettingsDialog setDialogState={setDialogState} />
        )}
      </div>
    </div>
  );
}
function DFrame({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-700 p-8 rounded-lg shadow-xl">{children}</div>;
}
function DButton({
  onClick,
  children,
  ...props
}: {
  onClick: () => void;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <div className="flex justify-end w-full">
      <button
        className="    justify-self-end    bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md"
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    </div>
  );
}
function DTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-xl font-bold text-center mb-8  text-pink-300  ">
      {children}
    </h1>
  );
}
function DContent({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4 mb-8">{children}</div>;
}
function DText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`text-s ${className}`}>{children}</div>;
}

function StartDialog({ start }: { start: () => void }) {
  const [countDown, setCountDown] = useState(-1);

  function startCountDown() {
    initEngine(new window.AudioContext());
    let count = 3;
    setCountDown(count);
    const interval = setInterval(() => {
      count--;
      setCountDown(count);
      if (count === 0) {
        clearInterval(interval);
        start();
      }
    }, 1000);
  }

  return (
    <DFrame>
      <DTitle>Butterflies in Bubbles</DTitle>
      <DContent>
        <AsciiArt />

        <DText>
          Move the cat, and find flowers that contain butterflies prisoned in
          bubbles
        </DText>
        <DText>Rescue the butterflies by popping the bubbles</DText>
        <DText>Do not let the bees catch you</DText>
        <DText>Use arrow keys to move the cat</DText>
      </DContent>
      {countDown < 0 && (
        <DButton autoFocus onClick={startCountDown} disabled={countDown !== -1}>
          Start
        </DButton>
      )}

      {countDown > 0 && (
        <div className="text-center">
          <DText>
            Game starts in <Nice>{countDown} seconds</Nice>
          </DText>
        </div>
      )}
    </DFrame>
  );
}

function PausedDialog() {
  function resume() {
    updateGameState({ dialogState: "none", showDialog: false });
    setTimeout(() => updateGameState({ paused: false }), 200);
  }
  return (
    <DFrame>
      <DTitle>Game Paused</DTitle>
      <DContent>
        <AsciiArt />
        <DText>Game is paused</DText>
        <DButton autoFocus onClick={resume}>
          Resume
        </DButton>
      </DContent>
    </DFrame>
  );
}

function GameOverDialog({
  setDialogState,
}: {
  setDialogState: React.Dispatch<React.SetStateAction<DialogState>>;
}) {
  function restart() {
    setDialogState("start");
  }
  return (
    <DFrame>
      <DTitle>Game Over</DTitle>
      <DContent>
        <DText>Game is over</DText>
        <DButton autoFocus onClick={restart}>
          Continue
        </DButton>
      </DContent>
    </DFrame>
  );
}

function Nice({
  children,
  classname,
}: {
  children: React.ReactNode;
  classname?: string;
}) {
  return (
    <span className={`text-2xl text-orange-500 ${classname}`}>{children}</span>
  );
}

function AsciiArt() {
  return (
    <div className="w-40 h-40 mx-auto relative text-center">
      <Image
        src="/cat_and_butterflies.png"
        alt="cat and butterfly"
        className="mx-auto"
        fill
      />
    </div>
  );
}

function LevelDialog({
  completedLevelNro,
  nextLevel,
  totalRescued,
}: {
  completedLevelNro: number;
  nextLevel: () => void;
  totalRescued: number;
}) {
  const { butterflies } = levelSettingList[completedLevelNro];
  return (
    <DFrame>
      <DTitle>Level {completedLevelNro + 1} Complete</DTitle>
      <DContent>
        <DText>You rescued {butterflies} butterflies</DText>

        <AsciiArt />
        {totalRescued > 0 && (
          <DText className="text-center">
            Total rescued <Nice classname="mt-1 ml-1">{totalRescued}</Nice>
          </DText>
        )}
      </DContent>

      <DButton autoFocus onClick={nextLevel}>
        Next
      </DButton>
    </DFrame>
  );
}

function SettingsDialog({
  setDialogState,
}: {
  setDialogState: React.Dispatch<React.SetStateAction<DialogState>>;
}) {
  function close() {
    setDialogState("none");
  }
  return (
    <DFrame>
      <DTitle>Settings</DTitle>
      <DContent>
        <DText>Settings</DText>
        <DButton autoFocus onClick={close}>
          Close
        </DButton>
      </DContent>
    </DFrame>
  );
}
