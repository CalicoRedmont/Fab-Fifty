(function () {
  "use strict";

  const FALLBACK_PLAYER_FIRST_NAMES = [
    "Fabien",
    "Carole",
    "Lucile",
    "Manu",
    "Elsie",
    "Stéphane",
    "Cécile",
    "Guillaume",
    "Camille",
    "Olivier",
    "Laure-Anne",
    "Émilie",
    "Pierre",
    "Mathilde",
    "Benjamin"
  ];
  const OLIVIER_ACCESS_PILOTS = [
    { key: "1", playerId: "olivierd", displayName: "OLIVIER D.", callsign: "OLIVIER-D" },
    { key: "2", playerId: "olivierr", displayName: "OLIVIER R.", callsign: "OLIVIER-R" }
  ];
  const preventKeys = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    " ",
    "=",
    "Enter"
  ]);
  let booted = false;
  let pendingBootMode = "title";

  setupAccessGate();

  function keyName(event) {
    if (event.code === "Equal" || event.key === "=") return "=";
    if (event.key.length === 1) return event.key.toLowerCase();
    return event.key;
  }

  function setupAccessGate() {
    const gate = document.getElementById("accessGate");
    const form = document.getElementById("accessForm");
    const input = document.getElementById("accessPassword");
    const error = document.getElementById("accessError");

    if (!gate || !form || !input) {
      setCurrentPlayerName("Fabien");
      bootGame();
      return;
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      const password = input.value;
      const playerName = resolveAccessPlayerName(password);

      if (isOlivierWarGamePassword(password)) {
        showOlivierPilotSelect(gate, form);
        return;
      }

      if (isWarGamePassword(password)) {
        pendingBootMode = "wargame";
        setCurrentPlayerName(playerName || "Fabien");
      } else if (!playerName) {
        if (error) error.textContent = "Mot de passe incorrect.";
        input.select();
        return;
      } else {
        pendingBootMode = "title";
        setCurrentPlayerName(playerName);
      }

      document.body.classList.remove("access-locked");
      gate.remove();
      bootGame();
    });
  }

  function normalizePassword(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function isAllowedPassword(value) {
    return !!resolveAccessPlayerName(value);
  }

  function isWarGamePassword(value) {
    const config = window.BadPongConfig || {};
    return config.ENABLE_WARGAME && normalizePassword(value) === "wargame";
  }

  function isOlivierWarGamePassword(value) {
    const config = window.BadPongConfig || {};
    return config.ENABLE_WARGAME && normalizePassword(value) === "olivier";
  }

  function getAllowedPasswords() {
    const passwords = new Set(FALLBACK_PLAYER_FIRST_NAMES.map(normalizePassword));
    const players = (window.BadPongConfig && window.BadPongConfig.PLAYERS) || [];

    players.forEach(player => {
      if (!player || player.id === "machine") return;
      const firstName = playerFirstName(player.name);
      if (firstName) passwords.add(normalizePassword(firstName));
    });

    return passwords;
  }

  function resolveAccessPlayerName(value) {
    const password = normalizePassword(value);
    const players = (window.BadPongConfig && window.BadPongConfig.PLAYERS) || [];
    const player = players.find(candidate => {
      if (!candidate || candidate.id === "machine") return false;
      return normalizePassword(playerFirstName(candidate.name)) === password;
    });
    if (player) return playerFirstName(player.name) || player.name;

    return FALLBACK_PLAYER_FIRST_NAMES.find(name => normalizePassword(name) === password) || "";
  }

  function showOlivierPilotSelect(gate, form) {
    const pilots = getOlivierAccessPilots();
    injectOlivierAccessStyles();
    form.classList.add("olivier-select-panel");
    form.innerHTML = `
      <p class="access-kicker">IDENTITY CHECK</p>
      <h1>DE QUEL OLIVIER S'AGIT-IL ?</h1>
      <p class="access-tagline">PASSWORD: OLIVIER</p>
      <div class="olivier-choice-grid">
        ${pilots.map((pilot, index) => `
          <button class="olivier-choice" type="button" data-olivier-index="${index}">
            <span class="olivier-choice-key">[${pilot.key}]</span>
            <img src="${pilot.imageSrc}" alt="${pilot.displayName}">
            <strong>${pilot.displayName}</strong>
            <span>CALLSIGN: ${pilot.callsign}</span>
          </button>
        `).join("")}
      </div>
      <p class="access-error" role="status" aria-live="polite">SELECT PILOT ID: 1 OU 2</p>
    `;
    form.querySelectorAll("[data-olivier-index]").forEach(button => {
      button.addEventListener("click", () => selectOlivierAccessPilot(gate, pilots[Number(button.dataset.olivierIndex)]));
    });
    form.addEventListener("keydown", event => {
      if (event.key === "1") selectOlivierAccessPilot(gate, pilots[0]);
      if (event.key === "2") selectOlivierAccessPilot(gate, pilots[1]);
    });
    form.tabIndex = -1;
    form.focus();
  }

  function selectOlivierAccessPilot(gate, pilot) {
    if (!pilot) return;
    pendingBootMode = "wargame";
    setCurrentPlayerName(pilot.playerName, {
      playerId: pilot.playerId,
      pilotDisplayName: pilot.displayName,
      pilotCallsign: pilot.callsign
    });
    document.body.classList.remove("access-locked");
    gate.remove();
    bootGame();
  }

  function getOlivierAccessPilots() {
    const config = window.BadPongConfig || {};
    const players = config.PLAYERS || [];
    return OLIVIER_ACCESS_PILOTS.map(pilot => {
      const player = (config.playerById && config.playerById(pilot.playerId))
        || players.find(candidate => candidate.id === pilot.playerId)
        || {};
      const file = player.files && player.files[0] ? player.files[0] : "";
      return Object.assign({}, pilot, {
        playerName: player.name || pilot.displayName,
        imageSrc: file ? `assets/images/${file}` : ""
      });
    });
  }

  function injectOlivierAccessStyles() {
    if (document.getElementById("olivierAccessStyles")) return;
    const style = document.createElement("style");
    style.id = "olivierAccessStyles";
    style.textContent = `
      .access-panel.olivier-select-panel {
        width: min(760px, calc(100vw - 28px));
        max-width: 760px;
      }
      .olivier-choice-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
        margin: 22px 0 14px;
      }
      .olivier-choice {
        appearance: none;
        border: 2px solid rgba(57, 255, 104, 0.65);
        background: rgba(0, 0, 0, 0.78);
        color: #39ff68;
        cursor: pointer;
        display: grid;
        gap: 8px;
        font: inherit;
        letter-spacing: 0;
        min-height: 220px;
        padding: 12px;
        text-align: left;
        text-transform: uppercase;
      }
      .olivier-choice:hover,
      .olivier-choice:focus {
        border-color: #f7d56b;
        box-shadow: 0 0 18px rgba(57, 255, 104, 0.35);
        outline: none;
      }
      .olivier-choice img {
        aspect-ratio: 1;
        border: 1px solid rgba(57, 255, 104, 0.5);
        filter: grayscale(1) contrast(1.25) sepia(1) hue-rotate(58deg) saturate(3);
        image-rendering: pixelated;
        object-fit: cover;
        width: 100%;
      }
      .olivier-choice-key {
        color: #f7d56b;
      }
      @media (max-width: 620px) {
        .olivier-choice-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setCurrentPlayerName(name, details = {}) {
    const playerName = String(name || "Fabien").trim() || "Fabien";
    window.BadPongCurrentPlayerName = playerName;
    window.BadPongSession = Object.assign({}, window.BadPongSession, {
      playerName,
      playerId: details.playerId || "",
      pilotDisplayName: details.pilotDisplayName || "",
      pilotCallsign: details.pilotCallsign || ""
    });
  }

  function playerFirstName(name) {
    const cleanName = String(name || "").trim();
    if (!cleanName) return "";
    return cleanName.split(/\s+/)[0].replace(/[.,;:]+$/g, "");
  }

  function bootGame() {
    if (booted) return;
    booted = true;

    window.installScreens(window.Game);
    if (window.installWargame) window.installWargame(window.Game);

    const canvas = document.getElementById("game");
    const game = new window.Game(canvas);
    if (pendingBootMode === "wargame" && game.startWarGameBoot) game.startWarGameBoot();
    let last = performance.now();

    window.addEventListener("keydown", event => {
      const key = keyName(event);
      if (shouldPreventDefault(key)) event.preventDefault();
      game.keys.add(key);
      game.audio.init();
      if (key !== "f") game.requestStartupFullscreen();
      if (!event.repeat) game.handleKeyDown(key);
    }, { passive: false });

    window.addEventListener("keyup", event => {
      const key = keyName(event);
      if (shouldPreventDefault(key)) event.preventDefault();
      game.keys.delete(key);
    }, { passive: false });

    window.addEventListener("blur", () => game.keys.clear());

    canvas.addEventListener("click", () => canvas.focus());
    canvas.addEventListener("pointerdown", event => {
      canvas.focus();
      game.requestStartupFullscreen();
      const point = logicalPoint(event);
      if (game.handlePointerDown(point.x, point.y)) {
        game.touchActive = false;
        return;
      }
      game.touchActive = true;
      updateTouch(event);
    });
    canvas.addEventListener("pointermove", event => {
      if (game.touchActive) updateTouch(event);
    });
    canvas.addEventListener("pointerup", () => { game.touchActive = false; });
    canvas.addEventListener("pointercancel", () => { game.touchActive = false; });

    function updateTouch(event) {
      game.touchY = logicalPoint(event).y;
    }

    function logicalPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * game.width,
        y: ((event.clientY - rect.top) / rect.height) * game.height
      };
    }

    function shouldPreventDefault(key) {
      const controls = game.controls || {};
      return preventKeys.has(key)
        || key === controls.p1Up
        || key === controls.p1Down
        || key === controls.p2Up
        || key === controls.p2Down;
    }

    canvas.focus();
    game.requestStartupFullscreen();

    function frame(now) {
      const dt = (now - last) / 1000;
      last = now;
      game.update(dt);
      game.draw();
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }
})();
