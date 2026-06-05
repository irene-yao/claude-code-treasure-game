import { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { AuthDialog } from "./components/AuthDialog";
import { useAuth } from "./context/AuthContext";
import { api } from "./lib/api";
import closedChest from "./assets/treasure_closed.png";
import treasureChest from "./assets/treasure_opened.png";
import emptyChest from "./assets/treasure_empty.png";
import skeletonChest from "./assets/treasure_opened_skeleton.png";
import chestOpenSound from "./audios/chest_open.mp3";
import evilLaughSound from "./audios/chest_open_with_evil_laugh.mp3";
import keyIcon from "./assets/key.png";

interface Box {
  id: number;
  isOpen: boolean;
  value: number; // 100, 0, or -100
}

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const initializeGame = () => {
    const values = [100, 0, -100].sort(() => Math.random() - 0.5);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      value: values[index],
    }));

    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
    setShowDialog(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const openBox = (boxId: number) => {
    if (gameEnded) return;

    setBoxes((prevBoxes) => {
      const updatedBoxes = prevBoxes.map((box) => {
        if (box.id === boxId && !box.isOpen) {
          new Audio(box.value > 0 ? chestOpenSound : evilLaughSound).play();
          setScore(box.value);
          return { ...box, isOpen: true };
        }
        return box;
      });

      if (updatedBoxes.some((box) => box.isOpen)) {
        setGameEnded(true);
        setShowDialog(true);
      }

      return updatedBoxes;
    });
  };

  // Save score to server when game ends and user is logged in
  useEffect(() => {
    if (gameEnded && user) {
      api.saveScore(score).catch(() => {});
    }
  }, [gameEnded]);

  const launchFireworks = useCallback(() => {
    const burst = (x: number, y: number) =>
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x, y },
        colors: ["#FFD700", "#FF6B35", "#F7931E", "#FFF200", "#FF0000"],
        zIndex: 9999,
      });

    burst(0.25, 0.5);
    setTimeout(() => burst(0.75, 0.4), 200);
    setTimeout(() => burst(0.5, 0.3), 400);
    setTimeout(() => burst(0.2, 0.35), 600);
    setTimeout(() => burst(0.8, 0.5), 800);
  }, []);

  useEffect(() => {
    if (showDialog && score > 0) {
      launchFireworks();
    }
  }, [showDialog, score, launchFireworks]);

  const resetGame = () => {
    initializeGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">

      {/* Auth header */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {!loading && (
          user ? (
            <>
              <span className="text-sm text-amber-800">{user.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="border-amber-400 text-amber-800 hover:bg-amber-100"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowAuthDialog(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Sign In
            </Button>
          )
        )}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">
          🏴‍☠️ Treasure Hunt Game 🏴‍☠️
        </h1>
        <p className="text-amber-800 mb-4">
          Click on the treasure chests to discover what's inside!
        </p>
        <p className="text-amber-700 text-sm">
          💰 Treasure: +$100 | 📦 Empty: $0 | 💀 Skeleton: -$100
        </p>
      </div>

      <div className="mb-8">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${score}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {boxes.map((box) => (
          <motion.div
            key={box.id}
            className="flex flex-col items-center"
            style={{
              cursor: box.isOpen ? "default" : `url(${keyIcon}) 16 16, pointer`,
            }}
            whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
            whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
            onClick={() => openBox(box.id)}
          >
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{
                rotateY: box.isOpen ? 180 : 0,
                scale: box.isOpen ? 1.1 : 1,
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <img
                src={
                  box.isOpen
                    ? box.value > 0
                      ? treasureChest
                      : box.value === 0
                        ? emptyChest
                        : skeletonChest
                    : closedChest
                }
                alt={
                  box.isOpen
                    ? box.value > 0
                      ? "Treasure!"
                      : box.value === 0
                        ? "Empty!"
                        : "Skeleton!"
                    : "Treasure Chest"
                }
                className="w-48 h-48 object-contain drop-shadow-lg"
              />

              {box.isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                >
                  {box.value > 0 ? (
                    <div className="text-2xl animate-bounce">✨💰✨</div>
                  ) : box.value === 0 ? (
                    <div className="text-2xl animate-pulse">📦💨📦</div>
                  ) : (
                    <div className="text-2xl animate-pulse">💀👻💀</div>
                  )}
                </motion.div>
              )}
            </motion.div>

            <div className="mt-4 text-center">
              {box.isOpen ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className={`text-lg p-2 rounded-lg ${
                    box.value > 0
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : box.value === 0
                        ? "bg-gray-100 text-gray-700 border border-gray-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                  }`}
                >
                  {box.value > 0 ? "+$100" : box.value === 0 ? "$0" : "-$100"}
                </motion.div>
              ) : (
                <div className="text-amber-700 p-2">Click to open!</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="text-center sm:max-w-sm">
          <DialogHeader>
            <DialogTitle
              className={`text-4xl font-bold text-center ${
                score > 0
                  ? "text-green-600"
                  : score === 0
                    ? "text-blue-600"
                    : "text-red-600"
              }`}
            >
              {score > 0 ? "WIN" : score === 0 ? "EMPTY" : "LOSE"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-lg text-amber-800">
            Final Score:{" "}
            <span className={score >= 0 ? "text-green-600" : "text-red-600"}>
              ${score}
            </span>
          </p>
          <p className="text-sm text-amber-600">
            {score > 0
              ? "Treasure found! Well done, treasure hunter! 🎉"
              : score === 0
                ? "Nothing inside... try again! 📦"
                : "A skeleton! Better luck next time! 💀"}
          </p>
          {user && (
            <p className="text-xs text-amber-500">Score saved to your account.</p>
          )}
        </DialogContent>
      </Dialog>

      {gameEnded && (
        <Button
          onClick={resetGame}
          className="text-lg px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white"
        >
          Play Again
        </Button>
      )}

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
}
