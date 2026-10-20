"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Home() {
  const mountRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0); // Game restart ko handle karne ke liye

  const gameRef = useRef({ score: 0, gameOver: false, gameStarted: false });
  gameRef.current = { score, gameOver, gameStarted };

  useEffect(() => {
    if (!gameStarted) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.7, window.innerHeight * 0.6);
    
    const currentMount = mountRef.current;
    if (currentMount) {
      currentMount.innerHTML = ""; // Purana canvas clear karne ke liye
      currentMount.appendChild(renderer.domElement);
    }

    // 2. Player Cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const player = new THREE.Mesh(geometry, material);
    player.position.y = -2;
    scene.add(player);

    // 3. Green Collectible Ball
    const greenGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const greenBall = new THREE.Mesh(greenGeo, greenMat);
    greenBall.position.x = -2;
    greenBall.position.y = 3;
    scene.add(greenBall);

    // 4. Red Danger Ball (Obstacle)
    const redGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const redBall = new THREE.Mesh(redGeo, redMat);
    redBall.position.x = 2;
    redBall.position.y = 4;
    scene.add(redBall);

    // 5. Keyboard Controls
    const playerSpeed = 0.15;
    const keys = { left: false, right: false };

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
    };

    const handleKeyUp = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // 6. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!gameRef.current.gameOver) {
        // Player movement
        if (keys.left && player.position.x > -3.5) {
          player.position.x -= playerSpeed;
        }
        if (keys.right && player.position.x < 3.5) {
          player.position.x += playerSpeed;
        }

        // Balls falling
        greenBall.position.y -= 0.04;
        redBall.position.y -= 0.05;

        // Agar green ball miss ho jaye (neechay gir jaye) toh Game Over!
        if (greenBall.position.y < -3) {
          setGameOver(true);
        }

        if (redBall.position.y < -3) {
          redBall.position.y = 4;
          redBall.position.x = (Math.random() - 0.5) * 6;
        }

        // Green Ball Collision (Score increase)
        if (player.position.distanceTo(greenBall.position) < 0.9) {
          setScore((prev) => prev + 1);
          greenBall.position.y = 3;
          greenBall.position.x = (Math.random() - 0.5) * 6;
        }

        // Red Ball Collision (Game Over)
        if (player.position.distanceTo(redBall.position) < 0.9) {
          setGameOver(true);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
      if (currentMount) {
        currentMount.innerHTML = "";
      }
    };
  }, [gameStarted, gameKey]);

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setGameKey((prev) => prev + 1); // Key change karne se game fresh restart hogi
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-2">3D Ball-Collecting Game</h1>

      {!gameStarted ? (
        <div className="flex flex-col items-center mt-10">
          <p className="mb-4 text-lg text-gray-300">Catch Green Balls, Avoid Red Balls! Don't miss any Green Ball!</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg shadow-lg text-lg transition"
          >
            Start Game
          </button>
        </div>
      ) : (
        <>
          <p className="text-xl mb-4 text-emerald-400 font-semibold">Score: {score}</p>
          <div className="relative">
            <div ref={mountRef} className="border-2 border-blue-500 rounded-lg overflow-hidden shadow-lg" />
            
            {gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center rounded-lg">
                <h2 className="text-4xl font-bold text-red-500 mb-4">Game Over!</h2>
                <p className="text-xl mb-6">Final Score: {score}</p>
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg shadow-lg text-lg transition"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}