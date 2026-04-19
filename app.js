"use strict";

(function () {
  const canvas = document.getElementById("arena");
  const ctx = canvas.getContext("2d");
  const canvasShell = document.querySelector(".canvas-shell");
  const backdropLayer = createLayerCanvas();
  const backdropCtx = backdropLayer.getContext("2d");
  const trailLayer = createLayerCanvas();
  const trailCtx = trailLayer.getContext("2d");

  const startButton = document.getElementById("start-match");
  const pauseButton = document.getElementById("pause-match");
  const restartButton = document.getElementById("restart-round");
  const arenaSelect = document.getElementById("arena-select");
  const targetSelect = document.getElementById("target-select");
  const playerConfig = document.getElementById("player-config");
  const scoreboard = document.getElementById("scoreboard");
  const statusText = document.getElementById("status-text");
  const heroArena = document.getElementById("hero-arena");
  const heroStatus = document.getElementById("hero-status");
  const overlayChip = document.getElementById("overlay-chip");
  const roundChip = document.getElementById("round-chip");
  const turnLeftButton = document.getElementById("turn-left");
  const turnRightButton = document.getElementById("turn-right");
  const touchSurface = canvasShell || canvas;
  let isPlayMode = false;

  const CELL_SIZE = 8;
  const COLS = canvas.width / CELL_SIZE;
  const ROWS = canvas.height / CELL_SIZE;
  const BASE_STEP_MS = 64;
  const TRAIL_WIDTH = 3.2;
  const PLAYER_HEAD_LENGTH = 6.4;
  const PLAYER_HEAD_WIDTH = 3.6;
  const MAX_FRAME_DELTA_MS = 120;
  const ROUND_DELAY_MS = 2200;
  const COUNTDOWN_MS = 2600;
  const TOUCH_SWIPE_MIN = 24;
  const isTouchPreferred = window.matchMedia("(pointer: coarse)").matches;
  const LINK_UP = 1;
  const LINK_RIGHT = 2;
  const LINK_DOWN = 4;
  const LINK_LEFT = 8;

  const DIRECTIONS = {
    up: { x: 0, y: -1, opposite: "down", left: "left", right: "right" },
    down: { x: 0, y: 1, opposite: "up", left: "right", right: "left" },
    left: { x: -1, y: 0, opposite: "right", left: "down", right: "up" },
    right: { x: 1, y: 0, opposite: "left", left: "up", right: "down" },
  };

  const ARENAS = {
    blank: {
      label: "Open Reactor",
      description: "A completely open reaction space with no internal walls and no additives.",
      build() {},
    },
    circuit: {
      label: "Catalyst Lattice",
      description: "Tight channels and layered lanes that force aggressive chain growth.",
      build(mask) {
        border(mask);
        rect(mask, 15, 12, 4, 36);
        rect(mask, 33, 6, 3, 27);
        rect(mask, 33, 41, 3, 17);
        rect(mask, 51, 12, 4, 48);
        rect(mask, 72, 8, 3, 28);
        rect(mask, 72, 41, 3, 19);
        rect(mask, 90, 14, 4, 36);
        rect(mask, 21, 25, 18, 3);
        rect(mask, 57, 25, 15, 3);
        rect(mask, 75, 25, 15, 3);
        rect(mask, 21, 45, 24, 3);
        rect(mask, 57, 42, 26, 3);
      },
    },
    crossfire: {
      label: "Crosslink Grid",
      description: "A symmetric reactor pattern where propagation paths flip fast.",
      build(mask) {
        border(mask);
        rect(mask, 26, 12, 4, 17);
        rect(mask, 26, 43, 4, 17);
        rect(mask, 94, 12, 4, 17);
        rect(mask, 94, 43, 4, 17);
        rect(mask, 46, 9, 33, 4);
        rect(mask, 46, 58, 33, 4);
        rect(mask, 48, 27, 29, 4);
        rect(mask, 48, 40, 29, 4);
        rect(mask, 59, 18, 3, 13);
        rect(mask, 59, 40, 3, 13);
      },
    },
    gauntlet: {
      label: "Flow Reactor",
      description: "Long channels and choke points with just enough room to dodge termination.",
      build(mask) {
        border(mask);
        rect(mask, 18, 12, 3, 40);
        rect(mask, 36, 6, 3, 25);
        rect(mask, 36, 41, 3, 25);
        rect(mask, 57, 12, 3, 44);
        rect(mask, 78, 6, 3, 25);
        rect(mask, 78, 41, 3, 25);
        rect(mask, 99, 12, 3, 40);
        rect(mask, 21, 25, 12, 3);
        rect(mask, 39, 45, 15, 3);
        rect(mask, 60, 25, 15, 3);
        rect(mask, 81, 45, 15, 3);
      },
    },
  };

  const HUMAN_SLOT_DEFS = [
    {
      slot: 1,
      label: "Chain 1",
      color: "#00f0ff",
      controlsLabel: "Turn pads / Swipe",
      keys: {
        KeyW: "up",
        KeyS: "down",
        KeyA: "left",
        KeyD: "right",
      },
    },
    {
      slot: 2,
      label: "Chain 2",
      color: "#ff7a00",
      controlsLabel: "Arrow Keys",
      keys: {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      },
    },
    {
      slot: 3,
      label: "Chain 3",
      color: "#57ff3d",
      controlsLabel: "I J K L",
      keys: {
        KeyI: "up",
        KeyK: "down",
        KeyJ: "left",
        KeyL: "right",
      },
    },
    {
      slot: 4,
      label: "Chain 4",
      color: "#ff2fb3",
      controlsLabel: "T F G H",
      keys: {
        KeyT: "up",
        KeyG: "down",
        KeyF: "left",
        KeyH: "right",
      },
    },
    {
      slot: 5,
      label: "Chain 5",
      color: "#ffd400",
      controlsLabel: "8 4 2 6",
      keys: {
        Digit8: "up",
        Digit2: "down",
        Digit4: "left",
        Digit6: "right",
      },
    },
    {
      slot: 6,
      label: "Chain 6",
      color: "#ff3b30",
      controlsLabel: "Numpad 8 4 2 6",
      keys: {
        Numpad8: "up",
        Numpad2: "down",
        Numpad4: "left",
        Numpad6: "right",
      },
    },
  ];

  const EXTRA_CPU_SLOT_DEFS = [
    {
      slot: 7,
      label: "Chain 7",
      color: "#9b7bff",
      controlsLabel: "Extra auto chain",
      keys: {},
    },
    {
      slot: 8,
      label: "Chain 8",
      color: "#13d8c8",
      controlsLabel: "Extra auto chain",
      keys: {},
    },
    {
      slot: 9,
      label: "Chain 9",
      color: "#ff8aa8",
      controlsLabel: "Extra auto chain",
      keys: {},
    },
    {
      slot: 10,
      label: "Chain 10",
      color: "#47b8ff",
      controlsLabel: "Extra auto chain",
      keys: {},
    },
    {
      slot: 11,
      label: "Chain 11",
      color: "#9eff7d",
      controlsLabel: "Extra auto chain",
      keys: {},
    },
    {
      slot: 12,
      label: "Chain 12",
      color: "#ff9966",
      controlsLabel: "Extra auto chain",
      keys: {},
    },
  ];
  const SLOT_DEFS = [...HUMAN_SLOT_DEFS, ...EXTRA_CPU_SLOT_DEFS];
  const SLOT_BY_ID = Object.fromEntries(SLOT_DEFS.map((slot) => [slot.slot, slot]));

  const state = {
    wallMask: new Uint8Array(COLS * ROWS),
    trailMask: new Uint8Array(COLS * ROWS),
    trailLinks: new Uint8Array(COLS * ROWS),
    players: [],
    scores: {},
    status: "idle",
    statusMessage: "Configure the primary chains, then add extra CPU chains if needed.",
    arenaKey: arenaSelect.value,
    matchTarget: Number(targetSelect.value),
    countdownRemaining: COUNTDOWN_MS,
    roundDelayRemaining: 0,
    winner: null,
    lastFrame: 0,
    startedAtLeastOneRound: false,
    sparkles: [],
    touchStart: null,
    audio: null,
    scoreboardDirty: true,
  };

  init();

  function init() {
    renderBackdropLayer();
    trailCtx.imageSmoothingEnabled = false;
    buildPlayerConfig();

    arenaSelect.addEventListener("change", () => {
      state.arenaKey = arenaSelect.value;
      heroArena.textContent = ARENAS[state.arenaKey].label;
      updateStatus(`Reactor primed: ${ARENAS[state.arenaKey].description}`);
      if (!state.startedAtLeastOneRound) {
        resetArenaState();
      }
    });

    targetSelect.addEventListener("change", () => {
      state.matchTarget = Number(targetSelect.value);
      roundChip.textContent = `Target ${state.matchTarget}`;
    });

    startButton.addEventListener("click", () => {
      ensureAudio();
      startMatch();
    });

    pauseButton.addEventListener("click", () => {
      ensureAudio();
      togglePause();
    });

    restartButton.addEventListener("click", () => {
      ensureAudio();
      startMatch();
    });

    document.addEventListener("keydown", onKeyDown, { passive: false });
    touchSurface.addEventListener("touchstart", onTouchStart, { passive: false });
    touchSurface.addEventListener("touchmove", onTouchMove, { passive: false });
    touchSurface.addEventListener("touchend", onTouchEnd, { passive: false });
    touchSurface.addEventListener("touchcancel", onTouchCancel, { passive: false });
    canvas.addEventListener("pointerdown", ensureAudio, { passive: true });
    bindTurnButton(turnLeftButton, "left");
    bindTurnButton(turnRightButton, "right");

    heroArena.textContent = ARENAS[state.arenaKey].label;
    roundChip.textContent = `Target ${state.matchTarget}`;
    resetArenaState();
    updateScoreboard();
    syncPlayMode();
    requestAnimationFrame(frame);
  }

  function buildPlayerConfig() {
    const defaults = isTouchPreferred
      ? ["human", "cpu", "cpu", "cpu", "off", "off"]
      : ["human", "human", "cpu", "cpu", "off", "off"];

    const primaryRows = HUMAN_SLOT_DEFS.map((slot, index) => {
      return `
        <div class="player-row">
          <div class="player-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="player-dot" style="color:${slot.color}; background:${slot.color};"></span>
              <strong>${slot.label}</strong>
            </div>
            <small>${slot.controlsLabel}</small>
          </div>
          <label>
            <span class="sr-only">${slot.label} mode</span>
            <select data-slot="${slot.slot}">
              <option value="human"${defaults[index] === "human" ? " selected" : ""}>Manual</option>
              <option value="cpu"${defaults[index] === "cpu" ? " selected" : ""}>Auto</option>
              <option value="off"${defaults[index] === "off" ? " selected" : ""}>Off</option>
            </select>
          </label>
        </div>
      `;
    }).join("");

    const extraRows = EXTRA_CPU_SLOT_DEFS.map((slot) => {
      return `
        <div class="player-row extra-player-row">
          <div class="player-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="player-dot" style="color:${slot.color}; background:${slot.color};"></span>
              <strong>${slot.label}</strong>
            </div>
            <small>${slot.controlsLabel}</small>
          </div>
          <label>
            <span class="sr-only">${slot.label} mode</span>
            <select data-slot="${slot.slot}">
              <option value="off" selected>Off</option>
              <option value="cpu">Auto</option>
            </select>
          </label>
        </div>
      `;
    }).join("");

    playerConfig.innerHTML = `
      <div class="player-list" aria-label="Primary chain setup">
        ${primaryRows}
      </div>
      <details class="extra-player-group">
        <summary>Extra Auto Chains</summary>
        <div class="player-list extra-player-list" aria-label="Extra CPU chain setup">
          ${extraRows}
        </div>
      </details>
    `;

    for (const select of playerConfig.querySelectorAll("select")) {
      select.addEventListener("change", () => {
        markScoreboardDirty();
        if (state.status === "idle" || state.status === "match-over") {
          updateScoreboard();
        }
      });
    }
  }

  function onKeyDown(event) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }

    if (event.code === "Space") {
      ensureAudio();
      if (state.status === "idle" || state.status === "match-over") {
        startMatch();
      } else {
        togglePause();
      }
      return;
    }

    if (event.code === "KeyR") {
      ensureAudio();
      startMatch();
      return;
    }

    for (const player of state.players) {
      if (!player.alive || player.mode !== "human") {
        continue;
      }
      const mapped = player.keys[event.code];
      if (mapped) {
        queueDirection(player, mapped);
      }
    }
  }

  function onTouchStart(event) {
    if (state.status === "paused") {
      state.touchStart = null;
      return;
    }

    event.preventDefault();
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }
    state.touchStart = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchMove(event) {
    if (state.status === "paused") {
      state.touchStart = null;
      return;
    }

    if (!state.touchStart) {
      return;
    }

    event.preventDefault();
  }

  function onTouchEnd(event) {
    if (state.status === "paused") {
      state.touchStart = null;
      return;
    }

    event.preventDefault();
    const touch = event.changedTouches[0];
    if (!touch || !state.touchStart) {
      return;
    }

    const dx = touch.clientX - state.touchStart.x;
    const dy = touch.clientY - state.touchStart.y;
    state.touchStart = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < TOUCH_SWIPE_MIN) {
      return;
    }

    ensureAudio();
    if (state.status === "idle" || state.status === "match-over") {
      startMatch();
    }

    const player = getPrimaryHumanPlayer();
    if (!player) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(player, dx > 0 ? "right" : "left");
    } else {
      queueDirection(player, dy > 0 ? "down" : "up");
    }
  }

  function onTouchCancel(event) {
    if (state.status !== "paused") {
      event.preventDefault();
    }
    state.touchStart = null;
  }

  function bindTurnButton(button, side) {
    if (!button) {
      return;
    }

    const onPress = (event) => {
      event.preventDefault();
      handleRelativeTurn(side);
    };

    button.addEventListener("pointerdown", onPress);
  }

  function handleRelativeTurn(side) {
    ensureAudio();
    if (state.status === "idle" || state.status === "match-over") {
      startMatch();
    }

    const player = getPrimaryHumanPlayer();
    if (!player) {
      return;
    }

    const sourceDirection = player.pendingDirection || player.direction;
    const nextDirection = DIRECTIONS[sourceDirection][side];
    queueDirection(player, nextDirection);
  }

  function getPrimaryHumanPlayer() {
    return state.players.find((item) => item.slot === 1 && item.mode === "human");
  }

  function queueDirection(player, nextDirection) {
    if (!player.alive) {
      return;
    }
    const currentDirection = player.pendingDirection || player.direction;
    if (DIRECTIONS[currentDirection].opposite === nextDirection) {
      return;
    }
    player.pendingDirection = nextDirection;
  }

  function ensureAudio() {
    if (state.audio) {
      if (state.audio.state === "suspended") {
        state.audio.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    state.audio = new AudioContextClass();
  }

  function playTone(frequency, duration, type, gain, sweep) {
    if (!state.audio) {
      return;
    }

    const startTime = state.audio.currentTime;
    const oscillator = state.audio.createOscillator();
    const amp = state.audio.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    if (sweep) {
      oscillator.frequency.exponentialRampToValueAtTime(sweep, startTime + duration);
    }

    amp.gain.setValueAtTime(gain, startTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(amp);
    amp.connect(state.audio.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  function startMatch() {
    state.matchTarget = Number(targetSelect.value);
    const participants = getConfiguredPlayers();

    if (participants.length === 0) {
      updateStatus("Enable at least one chain before starting a reaction.");
      return;
    }

    for (const slot of SLOT_DEFS) {
      state.scores[slot.slot] = 0;
    }

    state.startedAtLeastOneRound = true;
    startRound();
  }

  function startRound() {
    resetArenaState();
    const configured = getConfiguredPlayers();

    if (configured.length === 0) {
      state.status = "idle";
      overlayChip.textContent = "Awaiting initiation";
      updateStatus("Enable at least one chain before starting a cycle.");
      return;
    }

    state.players = createRoundPlayers(configured);
    state.sparkles.length = 0;
    state.countdownRemaining = COUNTDOWN_MS;
    state.roundDelayRemaining = 0;
    state.winner = null;
    state.status = "countdown";
    overlayChip.textContent = "Initiation in progress";
    roundChip.textContent = `Target ${state.matchTarget}`;
    updateStatus("Cycle primed. Hold your chain steady until initiation clears.");
    playTone(380, 0.08, "square", 0.025, 460);
    markScoreboardDirty();
  }

  function createRoundPlayers(configuredSlots) {
    const centerColumn = Math.floor(COLS / 2);
    const centerRow = Math.floor(ROWS / 2);
    const edgeLane = 1;
    const topRow = edgeLane;
    const bottomRow = ROWS - 1 - edgeLane;
    const leftColumn = edgeLane;
    const rightColumn = COLS - 1 - edgeLane;
    const sideOffsetX = 20;
    const sideOffsetY = 12;
    const spawnBySlot = {
      1: { x: leftColumn, y: topRow, direction: "down" },
      2: { x: rightColumn, y: bottomRow, direction: "up" },
      3: { x: rightColumn, y: topRow, direction: "down" },
      4: { x: leftColumn, y: bottomRow, direction: "up" },
      5: { x: centerColumn, y: topRow, direction: "down" },
      6: { x: centerColumn, y: bottomRow, direction: "up" },
      7: { x: leftColumn, y: centerRow, direction: "right" },
      8: { x: rightColumn, y: centerRow, direction: "left" },
      9: { x: centerColumn - sideOffsetX, y: topRow, direction: "down" },
      10: { x: rightColumn, y: centerRow - sideOffsetY, direction: "left" },
      11: { x: centerColumn + sideOffsetX, y: bottomRow, direction: "up" },
      12: { x: leftColumn, y: centerRow + sideOffsetY, direction: "right" },
    };
    const fallbackSpawns = [
      { x: centerColumn + sideOffsetX, y: topRow, direction: "down" },
      { x: rightColumn, y: centerRow + sideOffsetY, direction: "left" },
      { x: centerColumn - sideOffsetX, y: bottomRow, direction: "up" },
      { x: leftColumn, y: centerRow - sideOffsetY, direction: "right" },
    ];

    return configuredSlots.map((slot, index) => {
      const spawn = spawnBySlot[slot.slot] || fallbackSpawns[index % fallbackSpawns.length];
      const player = {
        ...slot,
        x: spawn.x,
        y: spawn.y,
        direction: spawn.direction,
        pendingDirection: spawn.direction,
        alive: true,
        stepTimer: 0,
        lastDecisionAt: 0,
      };

      setTrail(player.x, player.y, player.slot);
      return player;
    });
  }

  function getConfiguredPlayers() {
    const modes = Array.from(playerConfig.querySelectorAll("select"));
    const humans = HUMAN_SLOT_DEFS.map((slot) => {
      const select = modes.find((entry) => Number(entry.dataset.slot) === slot.slot);
      const mode = select ? select.value : "off";

      return {
        ...slot,
        mode,
        score: readScore(slot.slot),
      };
    }).filter((slot) => slot.mode !== "off");

    const cpus = EXTRA_CPU_SLOT_DEFS.map((slot) => {
      const select = modes.find((entry) => Number(entry.dataset.slot) === slot.slot);
      const mode = select ? select.value : "off";

      return {
        ...slot,
        mode,
        score: readScore(slot.slot),
      };
    }).filter((slot) => slot.mode === "cpu");

    return [...humans, ...cpus];
  }

  function readScore(slotNumber) {
    return state.scores[slotNumber] || 0;
  }

  function resetArenaState() {
    state.wallMask.fill(0);
    state.trailMask.fill(0);
    state.trailLinks.fill(0);
    clearTrailLayer();
    ARENAS[state.arenaKey].build(state.wallMask);
    renderBackdropLayer();
    markScoreboardDirty();
  }

  function togglePause() {
    if (state.status === "idle" || state.status === "match-over") {
      return;
    }

    if (state.status === "paused") {
      state.status = "running";
      overlayChip.textContent = "Propagation active";
      updateStatus("Reaction resumed.");
      playTone(520, 0.08, "triangle", 0.02, 760);
      return;
    }

    if (state.status === "running" || state.status === "countdown") {
      state.status = "paused";
      overlayChip.textContent = "Paused";
      updateStatus("Reaction paused. Hit pause again or press Space to resume.");
      playTone(280, 0.12, "sawtooth", 0.02, 180);
    }
  }

  function frame(timestamp) {
    const delta = Math.min(
      MAX_FRAME_DELTA_MS,
      Math.max(0, timestamp - (state.lastFrame || timestamp)),
    );
    state.lastFrame = timestamp;

    syncPlayMode();
    update(delta, timestamp);
    draw(timestamp);
    requestAnimationFrame(frame);
  }

  function syncPlayMode() {
    const nextPlayMode =
      state.status === "countdown"
      || state.status === "running"
      || state.status === "paused"
      || state.status === "round-over";

    if (nextPlayMode === isPlayMode) {
      return;
    }

    isPlayMode = nextPlayMode;
    document.body.classList.toggle("play-mode", nextPlayMode);
    document.body.classList.toggle("paused-scroll", state.status === "paused");

    if (nextPlayMode) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }

  function update(delta, timestamp) {
    if (state.status === "countdown") {
      state.countdownRemaining -= delta;
      const secondsLeft = Math.ceil(state.countdownRemaining / 1000);
      overlayChip.textContent = secondsLeft > 0 ? `Initiate in ${secondsLeft}` : "Propagation active";
      heroStatus.textContent = secondsLeft > 0 ? `Countdown ${secondsLeft}` : "Propagation active";

      if (state.countdownRemaining <= 0) {
        state.status = "running";
        overlayChip.textContent = "Propagation active";
        updateStatus(`Propagation active. Keep your chain alive in ${ARENAS[state.arenaKey].label}.`);
        playTone(640, 0.09, "square", 0.03, 920);
      }
      return;
    }

    if (state.status === "paused" || state.status === "idle" || state.status === "match-over") {
      return;
    }

    if (state.status === "round-over") {
      state.roundDelayRemaining -= delta;
      if (state.roundDelayRemaining <= 0) {
        const champion = state.players.find((player) => player.score >= state.matchTarget);
        if (champion) {
          state.status = "match-over";
          overlayChip.textContent = `${champion.label} takes the reaction`;
          heroStatus.textContent = `${champion.label} reached ${champion.score}`;
          updateStatus(`${champion.label} wins the reaction. Start another synthesis whenever you want.`);
          playTone(680, 0.16, "triangle", 0.03, 900);
          playTone(920, 0.18, "triangle", 0.024, 1240);
        } else {
          startRound();
        }
      }
      return;
    }

    for (const player of state.players) {
      if (!player.alive) {
        continue;
      }

      if (player.mode === "cpu") {
        thinkForCpu(player, timestamp);
      }

      player.stepTimer += delta;
      while (player.stepTimer >= BASE_STEP_MS && player.alive && state.status === "running") {
        player.stepTimer -= BASE_STEP_MS;
        stepPlayer(player, timestamp);
      }
    }

    state.sparkles = state.sparkles.filter((spark) => spark.until > timestamp);

    const living = state.players.filter((player) => player.alive);
    if (state.players.length > 1 && living.length <= 1) {
      finishRound(living[0] || null);
    } else if (state.players.length === 1 && living.length === 0) {
      finishRound(null);
    }

    updateScoreboard();
  }

  function finishRound(winner) {
    state.status = "round-over";
    state.roundDelayRemaining = ROUND_DELAY_MS;
    state.winner = winner;

    if (winner && state.players.length > 1) {
      winner.score += 1;
      state.scores[winner.slot] = winner.score;
      overlayChip.textContent = `${winner.label} survives the cycle`;
      heroStatus.textContent = `Cycle survivor: ${winner.label}`;
      updateStatus(`${winner.label} outlasted the reactor and gains one survival point.`);
      playTone(540, 0.14, "square", 0.025, 760);
      playTone(760, 0.14, "triangle", 0.022, 980);
    } else {
      overlayChip.textContent = "Full termination";
      heroStatus.textContent = "Terminated cycle";
      updateStatus("Every chain terminated. The reactor resets with no score.");
      playTone(220, 0.18, "sawtooth", 0.024, 110);
    }

    markScoreboardDirty();
    updateScoreboard();
  }

  function thinkForCpu(player, timestamp) {
    if (timestamp - player.lastDecisionAt < BASE_STEP_MS * 0.5) {
      return;
    }

    player.lastDecisionAt = timestamp;
    const candidates = [
      player.direction,
      DIRECTIONS[player.direction].left,
      DIRECTIONS[player.direction].right,
    ];

    let bestDirection = player.direction;
    let bestScore = -Infinity;
    for (const direction of candidates) {
      const score = scoreDirection(player, direction);
      if (score > bestScore) {
        bestScore = score;
        bestDirection = direction;
      }
    }

    if (Math.random() < 0.12) {
      const riskyTurn = candidates[Math.floor(Math.random() * candidates.length)];
      if (scoreDirection(player, riskyTurn) > 4) {
        bestDirection = riskyTurn;
      }
    }

    queueDirection(player, bestDirection);
  }

  function scoreDirection(player, direction) {
    const vector = DIRECTIONS[direction];
    const nextX = player.x + vector.x;
    const nextY = player.y + vector.y;
    if (cellBlocked(nextX, nextY)) {
      return -Infinity;
    }

    const safeDistance = measureDistance(player.x, player.y, direction);
    const forwardDistance = measureDistance(nextX, nextY, direction);
    const leftDistance = measureDistance(nextX, nextY, DIRECTIONS[direction].left);
    const rightDistance = measureDistance(nextX, nextY, DIRECTIONS[direction].right);
    const escapeDistance = Math.max(leftDistance, rightDistance);
    const straightBonus = direction === player.direction ? 0.8 : 0;
    const edgeUsageScore = scoreEdgeUsage(
      player.x,
      player.y,
      nextX,
      nextY,
      safeDistance,
      escapeDistance,
    );

    return (
      safeDistance * 0.9
      + forwardDistance * 0.45
      + escapeDistance * 0.8
      + edgeUsageScore
      + straightBonus
      + Math.random() * 0.35
    );
  }

  function measureDistance(x, y, direction) {
    const vector = DIRECTIONS[direction];
    let distance = 0;
    let testX = x;
    let testY = y;

    while (distance < 24) {
      testX += vector.x;
      testY += vector.y;

      if (isOutOfBounds(testX, testY)) {
        break;
      }

      const index = getIndex(testX, testY);
      if (state.wallMask[index] || state.trailMask[index]) {
        break;
      }

      distance += 1;
    }

    return distance;
  }

  function scoreEdgeUsage(currentX, currentY, nextX, nextY, safeDistance, escapeDistance) {
    if (safeDistance < 4) {
      return 0;
    }

    const currentEdgeDistance = distanceToNearestEdge(currentX, currentY);
    const nextEdgeDistance = distanceToNearestEdge(nextX, nextY);
    const movingTowardEdge = Math.max(0, currentEdgeDistance - nextEdgeDistance);
    const perimeterLaneBonus =
      nextEdgeDistance <= 4 && escapeDistance >= 2
        ? (5 - nextEdgeDistance) * 0.85
        : 0;
    const edgeHoldBonus =
      currentEdgeDistance <= 2 && nextEdgeDistance <= 2 && safeDistance >= 6
        ? 1.4
        : 0;

    return movingTowardEdge * 1.5 + perimeterLaneBonus + edgeHoldBonus;
  }

  function distanceToNearestEdge(x, y) {
    return Math.min(x, y, COLS - 1 - x, ROWS - 1 - y);
  }

  function cellBlocked(x, y) {
    if (isOutOfBounds(x, y)) {
      return true;
    }

    const index = getIndex(x, y);
    return Boolean(state.wallMask[index] || state.trailMask[index]);
  }

  function stepPlayer(player, timestamp) {
    const previousX = player.x;
    const previousY = player.y;
    const direction = player.pendingDirection || player.direction;
    if (DIRECTIONS[player.direction].opposite !== direction) {
      player.direction = direction;
    }

    const vector = DIRECTIONS[player.direction];
    const nextX = player.x + vector.x;
    const nextY = player.y + vector.y;

    if (isOutOfBounds(nextX, nextY)) {
      eliminatePlayer(player, timestamp);
      return;
    }

    const nextIndex = getIndex(nextX, nextY);
    if (state.wallMask[nextIndex] || state.trailMask[nextIndex]) {
      eliminatePlayer(player, timestamp);
      return;
    }

    player.x = nextX;
    player.y = nextY;
    setTrail(previousX, previousY, player.slot);
    setTrail(player.x, player.y, player.slot);
    connectTrail(previousX, previousY, player.x, player.y, player.slot);
    paintTrailSegment(previousX, previousY, player.x, player.y, player.slot);
  }

  function eliminatePlayer(player, timestamp) {
    player.alive = false;
    state.sparkles.push({
      x: player.x,
      y: player.y,
      color: player.color,
      until: timestamp + 620,
    });
    markScoreboardDirty();
    updateScoreboard();
    updateStatus(`${player.label} terminated.`);
    playTone(200, 0.18, "sawtooth", 0.024, 80);
    playTone(120, 0.2, "triangle", 0.02, 50);
  }

  function draw(timestamp) {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackdrop();
    drawTrails();
    drawPlayers();
    drawSparkles(timestamp);
    drawOverlay();
    ctx.restore();
  }

  function renderBackdropLayer() {
    backdropCtx.clearRect(0, 0, canvas.width, canvas.height);
    backdropCtx.fillStyle = "#02090d";
    backdropCtx.fillRect(0, 0, canvas.width, canvas.height);

    backdropCtx.save();
    backdropCtx.globalAlpha = 0.12;
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if ((x + y) % 2 === 0) {
          backdropCtx.fillStyle = "rgba(17, 59, 44, 0.25)";
          backdropCtx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }
    backdropCtx.restore();

    backdropCtx.strokeStyle = "rgba(79, 242, 181, 0.06)";
    backdropCtx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += CELL_SIZE * 4) {
      backdropCtx.beginPath();
      backdropCtx.moveTo(x, 0);
      backdropCtx.lineTo(x, canvas.height);
      backdropCtx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += CELL_SIZE * 4) {
      backdropCtx.beginPath();
      backdropCtx.moveTo(0, y);
      backdropCtx.lineTo(canvas.width, y);
      backdropCtx.stroke();
    }

    backdropCtx.save();
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (!state.wallMask[getIndex(x, y)]) {
          continue;
        }

        const pixelX = x * CELL_SIZE;
        const pixelY = y * CELL_SIZE;
        backdropCtx.fillStyle = "rgba(140, 184, 95, 0.3)";
        backdropCtx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
        backdropCtx.strokeStyle = "rgba(205, 235, 168, 0.2)";
        backdropCtx.strokeRect(pixelX + 0.5, pixelY + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    }
    backdropCtx.restore();
  }

  function drawBackdrop() {
    ctx.drawImage(backdropLayer, 0, 0);
  }

  function drawTrails() {
    ctx.drawImage(trailLayer, 0, 0);
  }

  function drawPlayers() {
    for (const player of state.players) {
      if (!player.alive) {
        continue;
      }

      const renderPosition = getPlayerRenderPosition(player);
      const centerX = renderPosition.x;
      const centerY = renderPosition.y;
      const vector = DIRECTIONS[player.direction];
      const halfLength = PLAYER_HEAD_LENGTH / 2;
      ctx.save();
      ctx.strokeStyle = player.color;
      ctx.lineWidth = PLAYER_HEAD_WIDTH;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(centerX - vector.x * halfLength, centerY - vector.y * halfLength);
      ctx.lineTo(centerX + vector.x * halfLength, centerY + vector.y * halfLength);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSparkles(timestamp) {
    for (const spark of state.sparkles) {
      const progress = Math.max(0, (spark.until - timestamp) / 620);
      const centerX = spark.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = spark.y * CELL_SIZE + CELL_SIZE / 2;
      ctx.save();
      ctx.globalAlpha = progress;
      ctx.strokeStyle = spark.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8 + (1 - progress) * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawOverlay() {
    if (state.status === "running") {
      return;
    }

    ctx.save();
    ctx.fillStyle = "rgba(2, 6, 10, 0.38)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#dfffee";
    ctx.font = '700 44px "Avenir Next Condensed"';
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 18;
    const arenaLabel = ARENAS[state.arenaKey].label.toUpperCase();

    if (state.status === "idle") {
      ctx.fillText(`BIOPOL CHAIN REACTION // ${arenaLabel}`, centerX, centerY);
      ctx.font = "20px Menlo";
      ctx.fillStyle = "#93c7b0";
      ctx.fillText("Tap Start or use the turn pads", centerX, centerY + 40);
    } else if (state.status === "countdown") {
      const count = Math.max(1, Math.ceil(state.countdownRemaining / 1000));
      ctx.fillText(String(count), centerX, centerY);
      ctx.font = "20px Menlo";
      ctx.fillStyle = "#93c7b0";
      ctx.fillText("Hold your chain steady", centerX, centerY + 40);
    } else if (state.status === "paused") {
      ctx.fillText("PAUSED", centerX, centerY);
      ctx.font = "20px Menlo";
      ctx.fillStyle = "#93c7b0";
      ctx.fillText("Press Space or Pause to resume", centerX, centerY + 40);
    } else if (state.status === "round-over") {
      ctx.fillText(state.winner ? `${state.winner.label} survives` : "Cycle terminated", centerX, centerY);
      ctx.font = "20px Menlo";
      ctx.fillStyle = "#93c7b0";
      ctx.fillText("Next cycle is priming", centerX, centerY + 40);
    } else if (state.status === "match-over") {
      const champion = state.players.reduce((best, player) => {
        return !best || player.score > best.score ? player : best;
      }, null);
      ctx.fillText(champion ? `${champion.label} forms the longest chain` : "Reaction complete", centerX, centerY);
      ctx.font = "20px Menlo";
      ctx.fillStyle = "#93c7b0";
      ctx.fillText("Tap Start or the turn pads for another synthesis", centerX, centerY + 40);
    }
    ctx.restore();
  }

  function updateScoreboard() {
    if (!scoreboard || !state.scoreboardDirty) {
      return;
    }

    if (state.players.length === 0) {
      const previewPlayers = getConfiguredPlayers();
      if (previewPlayers.length) {
        scoreboard.innerHTML = previewPlayers.map((player) => {
          return `
            <div class="score-card">
              <div class="score-header">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="score-dot" style="background:${player.color}; color:${player.color};"></span>
                  <strong>${player.label}</strong>
                </div>
                <span class="score-value">0</span>
              </div>
              <small>${player.mode === "cpu" ? "Auto chain" : player.controlsLabel}</small>
              <div class="effect-strip">
                <span class="effect-badge">initiated</span>
              </div>
            </div>
          `;
        }).join("");
      } else {
        scoreboard.innerHTML = `
          <div class="score-card">
            <div class="score-header">
              <strong>No active chains yet</strong>
            </div>
            <small>Enable chains in the setup panel, then start a reaction.</small>
          </div>
        `;
      }
      state.scoreboardDirty = false;
      return;
    }

    scoreboard.innerHTML = state.players.map((player) => {
      const stateBadge =
        !player.alive && state.status !== "countdown"
          ? '<span class="effect-badge">terminated</span>'
          : '<span class="effect-badge">propagating</span>';

      return `
        <div class="score-card">
          <div class="score-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="score-dot" style="background:${player.color}; color:${player.color};"></span>
              <strong>${player.label}</strong>
            </div>
            <span class="score-value">${player.score}</span>
          </div>
          <small>${player.mode === "cpu" ? "Auto chain" : player.controlsLabel}</small>
          <div class="effect-strip">
            ${stateBadge}
          </div>
        </div>
      `;
    }).join("");
    state.scoreboardDirty = false;
  }

  function updateStatus(message) {
    state.statusMessage = message;
    statusText.textContent = message;
    heroStatus.textContent = overlayChip.textContent || message;
  }

  function getIndex(x, y) {
    return y * COLS + x;
  }

  function setTrail(x, y, owner) {
    state.trailMask[getIndex(x, y)] = owner;
  }

  function markScoreboardDirty() {
    state.scoreboardDirty = true;
  }

  function createLayerCanvas() {
    const layer = document.createElement("canvas");
    layer.width = canvas.width;
    layer.height = canvas.height;
    return layer;
  }

  function clearTrailLayer() {
    trailCtx.clearRect(0, 0, trailLayer.width, trailLayer.height);
  }

  function paintTrailSegment(fromX, fromY, toX, toY, owner) {
    if (!owner) {
      return;
    }

    const slot = SLOT_BY_ID[owner];
    if (!slot) {
      return;
    }

    trailCtx.save();
    trailCtx.strokeStyle = slot.color;
    trailCtx.lineWidth = TRAIL_WIDTH;
    trailCtx.lineCap = "butt";
    trailCtx.lineJoin = "round";
    trailCtx.beginPath();
    trailCtx.moveTo(fromX * CELL_SIZE + CELL_SIZE / 2, fromY * CELL_SIZE + CELL_SIZE / 2);
    trailCtx.lineTo(toX * CELL_SIZE + CELL_SIZE / 2, toY * CELL_SIZE + CELL_SIZE / 2);
    trailCtx.stroke();
    trailCtx.restore();
  }

  function getPlayerRenderPosition(player) {
    const progress =
      state.status === "running" && player.alive
        ? Math.min(player.stepTimer / BASE_STEP_MS, 0.999)
        : 0;
    const vector = DIRECTIONS[player.direction];

    return {
      x: (player.x + vector.x * progress) * CELL_SIZE + CELL_SIZE / 2,
      y: (player.y + vector.y * progress) * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  function connectTrail(fromX, fromY, toX, toY, owner) {
    const fromIndex = getIndex(fromX, fromY);
    const toIndex = getIndex(toX, toY);

    state.trailMask[fromIndex] = owner;
    state.trailMask[toIndex] = owner;

    if (toX === fromX + 1) {
      state.trailLinks[fromIndex] |= LINK_RIGHT;
      state.trailLinks[toIndex] |= LINK_LEFT;
    } else if (toX === fromX - 1) {
      state.trailLinks[fromIndex] |= LINK_LEFT;
      state.trailLinks[toIndex] |= LINK_RIGHT;
    } else if (toY === fromY + 1) {
      state.trailLinks[fromIndex] |= LINK_DOWN;
      state.trailLinks[toIndex] |= LINK_UP;
    } else if (toY === fromY - 1) {
      state.trailLinks[fromIndex] |= LINK_UP;
      state.trailLinks[toIndex] |= LINK_DOWN;
    }
  }

  function isOutOfBounds(x, y) {
    return x < 0 || y < 0 || x >= COLS || y >= ROWS;
  }

  function border(mask) {
    rect(mask, 0, 0, COLS, 1);
    rect(mask, 0, ROWS - 1, COLS, 1);
    rect(mask, 0, 0, 1, ROWS);
    rect(mask, COLS - 1, 0, 1, ROWS);
  }

  function rect(mask, startX, startY, width, height) {
    for (let y = startY; y < startY + height; y += 1) {
      for (let x = startX; x < startX + width; x += 1) {
        if (!isOutOfBounds(x, y)) {
          mask[getIndex(x, y)] = 1;
        }
      }
    }
  }
})();
