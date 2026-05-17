(function () {
  "use strict";

  const CFG = window.BadPongConfig || {};
  const WAR_BOOT_LINES = [
    "C:\\BADPONG> WARGAME",
    "PASSWORD ACCEPTED",
    "ACCESSING DARKWEB NODE",
    "BAD PONG INTERFACE DISCONNECTED",
    "LOADING WARGAME.EXE"
  ];
  const WAR_OLIVIER_PILOTS = [
    { playerId: "olivierd", displayName: "OLIVIER D.", callsign: "OLIVIER-D" },
    { playerId: "olivierr", displayName: "OLIVIER R.", callsign: "OLIVIER-R" }
  ];
  const WAR = {
    bootLineDelay: 0.68,
    bootExitDelay: 0.95,
    playerSpeed: 260,
    rapidCooldown: 0.13,
    heavyCooldown: 1.65,
    rapidSpeed: 560,
    heavySpeed: 330,
    standardSpawnBase: 2.15,
    hunterSpawnBase: 7.8,
    humanityLoss: 14,
    sanctuaryHumanityLoss: 25,
    coreHp: 6
  };

  function installWargame(Game) {
    const baseDraw = Game.prototype.draw;
    const baseUpdate = Game.prototype.update;
    const baseHandleKeyDown = Game.prototype.handleKeyDown;
    const baseStartTitle = Game.prototype.startTitle;

    Game.prototype.isWarGameScreen = function () {
      return this.screen === "wargameOlivierSelect"
        || this.screen === "wargameBoot"
        || this.screen === "wargame"
        || this.screen === "wargameGameOver"
        || this.screen === "wargameVictory";
    };

    Game.prototype.startTitle = function () {
      this.resetWarGameUnlock();
      this.wargamePilotOverride = null;
      this.wargameOlivierCursor = 0;
      if (this.wargame) this.wargame.returningToTitle = true;
      return baseStartTitle.call(this);
    };

    Game.prototype.draw = function () {
      if (this.screen === "wargameOlivierSelect") return this.drawWarGameOlivierSelect();
      if (this.screen === "wargameBoot") return this.drawWarGameBoot();
      if (this.screen === "wargame") return this.drawWarGame();
      if (this.screen === "wargameGameOver") return this.drawWarGameGameOver();
      if (this.screen === "wargameVictory") return this.drawWarGameVictory();
      return baseDraw.call(this);
    };

    Game.prototype.update = function (dt) {
      const safeDt = Math.min(0.033, dt);
      if (this.screen === "wargameOlivierSelect") {
        if (this.wargame) this.wargame.glitch = Math.max(0, this.wargame.glitch - safeDt);
        return;
      }
      if (this.screen === "wargameBoot") return this.updateWarGameBoot(safeDt);
      if (this.screen === "wargame") return this.updateWarGame(safeDt);
      return baseUpdate.call(this, dt);
    };

    Game.prototype.handleKeyDown = function (key) {
      if (this.screen === "title" && this.captureWarGameUnlock(key)) return;
      if (!this.isWarGameScreen()) return baseHandleKeyDown.call(this, key);
      return this.handleWarGameKey(key, baseHandleKeyDown);
    };

    Game.prototype.resetWarGameUnlock = function () {
      this.wargameUnlockBuffer = "";
    };

    Game.prototype.captureWarGameUnlock = function (key) {
      if (!CFG.ENABLE_WARGAME || this.screen !== "title") return false;
      if (!key || key.length !== 1 || !/[a-z]/i.test(key)) return false;
      this.wargameUnlockBuffer = `${this.wargameUnlockBuffer || ""}${key.toUpperCase()}`.slice(-7);
      if (this.wargameUnlockBuffer === "OLIVIER") {
        this.startWarGameOlivierSelect();
        return true;
      }
      if (this.wargameUnlockBuffer !== "WARGAME") return false;
      this.wargamePilotOverride = null;
      this.startWarGameBoot();
      return true;
    };

    Game.prototype.startWarGameOlivierSelect = function () {
      if (!CFG.ENABLE_WARGAME) return;
      this.wargamePilotOverride = null;
      this.wargameOlivierCursor = 0;
      this.resetWarGameState();
      this.wargame.glitch = 0.35;
      this.screen = "wargameOlivierSelect";
      this.audio.play("validate");
    };

    Game.prototype.selectWarGameOlivierPilot = function (index) {
      const pilot = WAR_OLIVIER_PILOTS[index] || WAR_OLIVIER_PILOTS[0];
      this.wargamePilotOverride = Object.assign({}, pilot);
      this.startWarGameBoot();
    };

    Game.prototype.startWarGameBoot = function () {
      if (!CFG.ENABLE_WARGAME) return;
      this.resetWarGameState();
      this.wargame.bootTime = 0;
      this.wargame.glitch = 0.45;
      this.screen = "wargameBoot";
      this.audio.play("validate");
    };

    Game.prototype.resetWarGameState = function () {
      const cities = [
        { name: "Paris", x: 472, y: 226, active: true, lost: false },
        { id: "montrouge", name: "Montrouge", displayName: "SANCTUARY: MONTROUGE", x: 490, y: 250, active: true, lost: false, type: "sanctuary" },
        { name: "New York", x: 245, y: 235, active: true, lost: false },
        { name: "Tokyo", x: 756, y: 260, active: true, lost: false },
        { name: "Sydney", x: 792, y: 398, active: true, lost: false },
        { name: "Le Cap", x: 505, y: 405, active: true, lost: false },
        { name: "São Paulo", x: 338, y: 380, active: true, lost: false },
        { name: "Londres", x: 455, y: 205, active: true, lost: false },
        { name: "Montréal", x: 267, y: 204, active: true, lost: false }
      ];
      const machineNodes = [
        { name: "ARCTIC SERVER", x: 488, y: 118, hp: 3, maxHp: 3, active: true, destroyed: false, core: false },
        { name: "PACIFIC RELAY", x: 720, y: 326, hp: 3, maxHp: 3, active: true, destroyed: false, core: false },
        { name: "ORBITAL UPLINK", x: 650, y: 156, hp: 3, maxHp: 3, active: true, destroyed: false, core: false },
        { name: "MACHINE CORE", x: 840, y: 170, hp: WAR.coreHp, maxHp: WAR.coreHp, active: true, destroyed: false, core: true }
      ];

      this.wargame = {
        bootTime: 0,
        time: 0,
        playerAircraft: {
          x: 480,
          y: 430,
          r: 15,
          vx: 0,
          vy: 0,
          state: "idle",
          fireFlash: 0,
          thrustAlpha: 0,
          thrustPhase: 0,
          destroyed: false
        },
        enemyMissiles: [],
        playerShots: [],
        heavyMissiles: [],
        cities,
        machineNodes,
        machineCore: machineNodes.find(node => node.core),
        humanity: 100,
        gameOver: false,
        gameOverReason: "",
        victory: false,
        spawnGrace: 3,
        spawnTimer: 3,
        hunterTimer: 9,
        rapidCooldown: 0,
        heavyCooldown: 0,
        explosions: [],
        selectedPilot: this.resolveWarGameSelectedPilot(),
        lastStatus: "SANCTUARY ONLINE: MONTROUGE",
        lastStatusDetail: "",
        machineGlitch: 0,
        returningToTitle: false,
        glitch: 0
      };
    };

    Game.prototype.startWarGame = function () {
      if (!this.wargame) this.resetWarGameState();
      this.wargame.bootTime = 0;
      this.wargame.time = 0;
      this.wargame.spawnGrace = 3;
      this.wargame.spawnTimer = 3;
      this.wargame.hunterTimer = 9;
      this.screen = "wargame";
      this.audio.play("bonus");
    };

    Game.prototype.handleWarGameKey = function (key, baseHandle) {
      if (key === CFG.SOUND_TOGGLE_KEY || key === "f") return baseHandle.call(this, key);
      if (this.screen === "wargameOlivierSelect") {
        if (key === "Escape") {
          this.keys.clear();
          this.startTitle();
          return;
        }
        if (key === "1") return this.selectWarGameOlivierPilot(0);
        if (key === "2") return this.selectWarGameOlivierPilot(1);
        if (key === "ArrowUp" || key === "z" || key === "w") {
          this.wargameOlivierCursor = this.wargameOlivierCursor === 0 ? WAR_OLIVIER_PILOTS.length - 1 : this.wargameOlivierCursor - 1;
          this.audio.play("menu");
          return;
        }
        if (key === "ArrowDown" || key === "s") {
          this.wargameOlivierCursor = (this.wargameOlivierCursor + 1) % WAR_OLIVIER_PILOTS.length;
          this.audio.play("menu");
          return;
        }
        if (key === "Enter" || key === " ") return this.selectWarGameOlivierPilot(this.wargameOlivierCursor || 0);
        return;
      }
      if (this.screen === "wargameGameOver" || this.screen === "wargameVictory") {
        if (key === "Enter" || key === " ") {
          this.keys.clear();
          this.resetWarGameState();
          this.startTitle();
        }
        return;
      }
      if (this.screen === "wargame") {
        if (key === "x" || key === "Control") this.fireWarGameHeavyMissile();
        if (key === "Escape") {
          this.keys.clear();
          this.resetWarGameState();
          this.startTitle();
        }
      }
    };

    Game.prototype.updateWarGameBoot = function (dt) {
      if (!this.wargame) this.resetWarGameState();
      this.wargame.bootTime += dt;
      this.wargame.glitch = Math.max(0, this.wargame.glitch - dt);
      const bootLines = this.warGameBootLines();
      const bootDuration = bootLines.length * WAR.bootLineDelay + WAR.bootExitDelay;
      if (this.wargame.bootTime >= bootDuration) this.startWarGame();
    };

    Game.prototype.updateWarGame = function (dt) {
      if (!this.wargame) this.resetWarGameState();
      const state = this.wargame;
      if (state.gameOver || state.victory) return;

      state.time += dt;
      state.rapidCooldown = Math.max(0, state.rapidCooldown - dt);
      state.heavyCooldown = Math.max(0, state.heavyCooldown - dt);
      state.playerAircraft.fireFlash = Math.max(0, state.playerAircraft.fireFlash - dt);
      state.glitch = Math.max(0, state.glitch - dt);
      state.machineGlitch = Math.max(0, state.machineGlitch - dt);

      this.updateWarGamePlayer(dt);
      if (this.key(" ")) this.fireWarGameRapidShot();
      if (state.spawnGrace > 0) {
        state.spawnGrace = Math.max(0, state.spawnGrace - dt);
        this.updateWarGameProjectiles(dt);
        this.updateWarGameExplosions(dt);
        return;
      }
      this.updateWarGameSpawns(dt);
      this.updateWarGameProjectiles(dt);
      this.updateWarGameExplosions(dt);
      this.checkWarGameEndStates();
    };

    Game.prototype.updateWarGamePlayer = function (dt) {
      const p = this.wargame.playerAircraft;
      let dx = 0;
      let dy = 0;
      if (this.key("ArrowLeft") || this.key("q") || this.key("a")) dx -= 1;
      if (this.key("ArrowRight") || this.key("d")) dx += 1;
      if (this.key("ArrowUp") || this.key("z") || this.key("w")) dy -= 1;
      if (this.key("ArrowDown") || this.key("s")) dy += 1;

      const len = Math.hypot(dx, dy) || 1;
      p.vx = (dx / len) * WAR.playerSpeed;
      p.vy = (dy / len) * WAR.playerSpeed;
      p.x = clamp(p.x + p.vx * dt, 72, this.width - 72);
      p.y = clamp(p.y + p.vy * dt, 104, this.height - 54);
      p.state = dx < 0 ? "bank_left" : dx > 0 ? "bank_right" : p.fireFlash > 0 ? "firing" : "idle";
      const moving = dx !== 0 || dy !== 0;
      p.thrustPhase += dt * (moving ? 26 : 18);
      p.thrustAlpha = moving
        ? Math.min(1, p.thrustAlpha + dt * 12)
        : Math.max(0, p.thrustAlpha - dt * 24);
      if (p.thrustAlpha < 0.03) p.thrustAlpha = 0;
    };

    Game.prototype.updateWarGameSpawns = function (dt) {
      const state = this.wargame;
      state.spawnTimer -= dt;
      state.hunterTimer -= dt;

      if (state.spawnTimer <= 0) {
        this.spawnWarGameMissile("standard");
        const difficulty = Math.min(1.15, state.time / 120);
        state.spawnTimer = Math.max(0.72, WAR.standardSpawnBase - difficulty + Math.random() * 0.7);
      }

      if (state.hunterTimer <= 0) {
        this.spawnWarGameMissile("hunter");
        const difficulty = Math.min(2.2, state.time / 70);
        state.hunterTimer = Math.max(3.8, WAR.hunterSpawnBase - difficulty + Math.random() * 3.4);
      }
    };

    Game.prototype.spawnWarGameMissile = function (type) {
      const state = this.wargame;
      const liveNodes = state.machineNodes.filter(node => !node.destroyed);
      const source = liveNodes[Math.floor(Math.random() * liveNodes.length)] || { x: this.width - 60, y: 92 };
      const target = type === "hunter"
        ? state.playerAircraft
        : randomItem(state.cities.filter(city => city.active));
      if (!target) return;
      if (type === "standard" && isWarSanctuary(target)) {
        state.lastStatus = "MACHINE: SANCTUARY TARGETED";
        state.lastStatusDetail = "";
      }

      const speed = type === "hunter"
        ? 118 + Math.min(58, state.time * 0.35)
        : 84 + Math.min(72, state.time * 0.42);
      const angle = Math.atan2(target.y - source.y, target.x - source.x);
      state.enemyMissiles.push({
        type,
        x: source.x,
        y: source.y,
        prevX: source.x,
        prevY: source.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        targetName: target.displayName || target.name || "PEACEKEEPER-50",
        target,
        r: type === "hunter" ? 6 : 5,
        life: 12
      });
    };

    Game.prototype.fireWarGameRapidShot = function () {
      const state = this.wargame;
      if (state.rapidCooldown > 0 || state.gameOver || state.victory) return;
      const p = state.playerAircraft;
      state.playerShots.push({
        x: p.x,
        y: p.y - 18,
        prevX: p.x,
        prevY: p.y - 18,
        vx: 0,
        vy: -WAR.rapidSpeed,
        r: 3,
        life: 1.5
      });
      p.fireFlash = 0.09;
      state.rapidCooldown = WAR.rapidCooldown;
      this.audio.play("bounce");
    };

    Game.prototype.fireWarGameHeavyMissile = function () {
      const state = this.wargame;
      if (state.heavyCooldown > 0 || state.gameOver || state.victory) return;
      const target = this.nextWarGameNodeTarget();
      if (!target) return;
      const p = state.playerAircraft;
      const angle = Math.atan2(target.y - p.y, target.x - p.x);
      state.heavyMissiles.push({
        x: p.x,
        y: p.y - 12,
        prevX: p.x,
        prevY: p.y - 12,
        vx: Math.cos(angle) * WAR.heavySpeed,
        vy: Math.sin(angle) * WAR.heavySpeed,
        target,
        r: 6,
        life: 3.2
      });
      p.fireFlash = 0.18;
      state.heavyCooldown = WAR.heavyCooldown;
      state.lastStatus = `HEAVY MISSILE -> ${target.name}`;
      state.lastStatusDetail = "";
      this.audio.play("validate");
    };

    Game.prototype.nextWarGameNodeTarget = function () {
      const state = this.wargame;
      const alive = state.machineNodes.filter(node => !node.destroyed);
      if (!alive.length) return null;
      const p = state.playerAircraft;
      return alive.reduce((best, node) => {
        if (!best) return node;
        return warDistance(p, node) < warDistance(p, best) ? node : best;
      }, null);
    };

    Game.prototype.updateWarGameProjectiles = function (dt) {
      const state = this.wargame;
      moveWarList(state.playerShots, dt);
      moveWarList(state.heavyMissiles, dt);
      moveWarList(state.enemyMissiles, dt);

      for (let i = state.playerShots.length - 1; i >= 0; i--) {
        const shot = state.playerShots[i];
        if (shot.life <= 0 || shot.y < 70) {
          state.playerShots.splice(i, 1);
          continue;
        }
        for (let j = state.enemyMissiles.length - 1; j >= 0; j--) {
          const missile = state.enemyMissiles[j];
          if (!warCircleHit(shot, missile, shot.r + missile.r + 8)) continue;
          this.addWarExplosion(missile.x, missile.y, this.colors.green, 10);
          state.enemyMissiles.splice(j, 1);
          state.playerShots.splice(i, 1);
          state.lastStatus = "MISSILE INTERCEPTED";
          state.lastStatusDetail = "";
          this.audio.play("destroy");
          break;
        }
      }

      for (let i = state.heavyMissiles.length - 1; i >= 0; i--) {
        const heavy = state.heavyMissiles[i];
        if (heavy.life <= 0 || heavy.x < 0 || heavy.x > this.width || heavy.y < 0 || heavy.y > this.height) {
          state.heavyMissiles.splice(i, 1);
          continue;
        }
        const target = heavy.target;
        if (!target || target.destroyed || !warCircleHit(heavy, target, heavy.r + 15)) continue;
        target.hp = Math.max(0, target.hp - 1);
        this.addWarExplosion(target.x, target.y, this.colors.amber, 16);
        state.heavyMissiles.splice(i, 1);
        state.lastStatus = `${target.name} DAMAGED`;
        state.lastStatusDetail = "";
        state.machineGlitch = 0.34;
        this.audio.play(target.hp <= 0 ? "win" : "destroy");
        if (target.hp <= 0) {
          target.destroyed = true;
          target.active = false;
          state.lastStatus = `${target.name} DESTROYED`;
          if (target.core) this.startWarGameVictory();
        }
      }

      for (let i = state.enemyMissiles.length - 1; i >= 0; i--) {
        const missile = state.enemyMissiles[i];
        if (missile.life <= 0 || missile.x < -40 || missile.x > this.width + 40 || missile.y < -40 || missile.y > this.height + 40) {
          state.enemyMissiles.splice(i, 1);
          continue;
        }
        if (missile.type === "hunter" && warCircleHit(missile, state.playerAircraft, missile.r + state.playerAircraft.r)) {
          this.addWarExplosion(state.playerAircraft.x, state.playerAircraft.y, this.colors.red, 24);
          this.startWarGameGameOver("aircraft");
          return;
        }
        if (missile.type === "standard" && missile.target && missile.target.active && warCircleHit(missile, missile.target, missile.r + 8)) {
          const target = missile.target;
          const sanctuary = isWarSanctuary(target);
          const humanityLoss = sanctuary ? WAR.sanctuaryHumanityLoss : WAR.humanityLoss;
          target.active = false;
          target.lost = true;
          state.humanity = Math.max(0, state.humanity - humanityLoss);
          state.enemyMissiles.splice(i, 1);
          state.lastStatus = sanctuary ? "SANCTUARY BREACHED: MONTROUGE" : `${target.name.toUpperCase()} LOST`;
          state.lastStatusDetail = sanctuary ? `HUMANITY -${WAR.sanctuaryHumanityLoss}%` : "";
          this.addWarExplosion(target.x, target.y, this.colors.red, sanctuary ? 24 : 18);
          this.audio.play("lose");
        }
      }
    };

    Game.prototype.updateWarGameExplosions = function (dt) {
      const list = this.wargame.explosions;
      for (let i = list.length - 1; i >= 0; i--) {
        const explosion = list[i];
        explosion.life -= dt;
        explosion.r += explosion.grow * dt;
        if (explosion.life <= 0) list.splice(i, 1);
      }
    };

    Game.prototype.checkWarGameEndStates = function () {
      const state = this.wargame;
      if (state.gameOver || state.victory) return;
      const citiesLost = state.cities.every(city => !city.active);
      if (state.humanity <= 0 || citiesLost) this.startWarGameGameOver("humanity");
    };

    Game.prototype.startWarGameGameOver = function (reason) {
      const state = this.wargame;
      state.gameOver = true;
      state.gameOverReason = reason;
      state.playerAircraft.destroyed = true;
      state.enemyMissiles.length = 0;
      state.playerShots.length = 0;
      state.heavyMissiles.length = 0;
      this.screen = "wargameGameOver";
      this.audio.play("lose");
    };

    Game.prototype.startWarGameVictory = function () {
      const state = this.wargame;
      state.victory = true;
      state.enemyMissiles.length = 0;
      state.playerShots.length = 0;
      state.heavyMissiles.length = 0;
      this.screen = "wargameVictory";
      this.audio.play("win");
    };

    Game.prototype.addWarExplosion = function (x, y, color, radius) {
      this.wargame.explosions.push({ x, y, r: 3, maxR: radius, grow: radius * 2.4, life: 0.36, color });
    };

    Game.prototype.drawWarGameOlivierSelect = function () {
      const ctx = this.ctx;
      const selected = this.wargameOlivierCursor || 0;
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.width, this.height);
      this.drawWarConsoleGrid(0.18);
      this.drawWarGlitch(this.wargame ? this.wargame.glitch : 0);
      this.panel(176, 64, 608, 392, 0.72);
      this.drawText("IDENTITY CHECK", 480, 108, 19, this.colors.green, "center");
      this.drawText("PASSWORD: OLIVIER", 480, 138, 16, this.colors.white, "center");
      this.neon("DE QUEL OLIVIER S'AGIT-IL ?", 480, 184, 22, this.colors.green, "center");
      WAR_OLIVIER_PILOTS.forEach((pilot, index) => {
        const x = 246 + index * 244;
        const y = 226;
        const player = this.warGamePilotById(pilot.playerId);
        const active = index === selected;
        if (active) {
          ctx.fillStyle = "rgba(57,255,104,0.13)";
          ctx.fillRect(x - 18, y - 20, 196, 156);
          ctx.strokeStyle = this.colors.amber;
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 18, y - 20, 196, 156);
          if (Math.floor(performance.now() / 180) % 2 === 0) this.drawText(">", x - 42, y + 58, 22, this.colors.amber);
        }
        if (!this.drawWarPhotoPortrait(player, x, y, 116, 116, active ? this.colors.amber : this.colors.green)) {
          this.drawWarPilotPortrait(player, x, y, 116, 116);
        }
        this.drawText(`[${index + 1}] ${pilot.displayName}`, x + 58, y + 142, active ? 18 : 16, active ? this.colors.amber : this.colors.green, "center");
        this.drawText(pilot.callsign, x + 58, y + 166, 12, this.colors.white, "center");
      });
      this.drawText("SELECT PILOT ID: 1 OU 2", 480, 424, 14, this.colors.white, "center");
      this.drawWarScanlines();
      ctx.restore();
    };

    Game.prototype.warGameBootLines = function () {
      const pilot = this.wargame && this.wargame.selectedPilot;
      if (!pilot) return WAR_BOOT_LINES;
      return [
        "C:\\BADPONG> OLIVIER",
        "IDENTITY CONFIRMED",
        `PILOT SELECTED: ${pilot.displayName}`,
        "ACCESSING DARKWEB NODE",
        "BAD PONG INTERFACE DISCONNECTED",
        "LOADING WARGAME.EXE"
      ];
    };

    Game.prototype.drawWarGameBoot = function () {
      const ctx = this.ctx;
      const state = this.wargame || { bootTime: 0, glitch: 0 };
      const bootLines = this.warGameBootLines();
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.width, this.height);
      this.drawWarConsoleGrid(0.18);
      this.drawWarGlitch(state.glitch);

      this.drawText("BAD PONG INTERFACE SHELL", 48, 54, 14, this.colors.green);
      const visible = Math.min(bootLines.length, Math.floor(state.bootTime / WAR.bootLineDelay) + 1);
      for (let i = 0; i < visible; i++) {
        const y = 132 + i * 42;
        const color = i === 0 ? this.colors.white : i === visible - 1 ? this.colors.amber : this.colors.green;
        this.drawText(bootLines[i], 86, y, i === 0 ? 22 : 20, color);
      }

      const cursorOn = Math.floor(performance.now() / 160) % 2 === 0;
      if (cursorOn) this.drawText("_", 86, 132 + visible * 42, 20, this.colors.green);
      this.drawWarScanlines();
      ctx.restore();
    };

    Game.prototype.drawWarGame = function () {
      const ctx = this.ctx;
      const state = this.wargame;
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.width, this.height);
      this.drawWarMap();
      this.drawWarCities();
      this.drawWarMachineNodes();
      this.drawWarProjectiles();
      this.drawWarAircraft();
      this.drawWarExplosions();
      this.drawWarHud();
      this.drawWarScanlines();
      ctx.restore();
    };

    Game.prototype.drawWarMap = function () {
      const ctx = this.ctx;
      this.drawWarConsoleGrid(0.22);
      ctx.save();
      ctx.strokeStyle = "rgba(57,255,104,0.38)";
      ctx.lineWidth = 2;
      ctx.shadowColor = this.colors.green;
      ctx.shadowBlur = 8;
      drawWarPolyline(ctx, [[140, 235], [208, 198], [298, 210], [348, 274], [318, 346], [246, 392], [162, 330], [128, 278]]);
      drawWarPolyline(ctx, [[385, 196], [455, 162], [560, 180], [625, 246], [586, 318], [494, 346], [420, 300]]);
      drawWarPolyline(ctx, [[590, 210], [695, 160], [818, 198], [858, 312], [770, 384], [650, 350], [628, 270]]);
      drawWarPolyline(ctx, [[430, 330], [535, 344], [560, 430], [494, 468], [438, 412]]);
      ctx.setLineDash([9, 10]);
      ctx.beginPath();
      ctx.arc(480, 278, 192, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    };

    Game.prototype.drawWarCities = function () {
      const ctx = this.ctx;
      for (const city of this.wargame.cities) {
        ctx.save();
        const sanctuary = isWarSanctuary(city);
        const label = city.displayName || city.name;
        const pulse = 0.55 + Math.sin(performance.now() / 150) * 0.45;
        const color = city.active ? this.colors.green : this.colors.red;
        ctx.strokeStyle = color;
        ctx.fillStyle = city.active ? "rgba(57,255,104,0.22)" : "rgba(255,56,85,0.20)";
        ctx.shadowColor = color;
        ctx.shadowBlur = sanctuary && city.active ? 18 : city.active ? 8 : 12;
        if (sanctuary && city.active) {
          ctx.globalAlpha = 0.5 + pulse * 0.38;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(city.x, city.y, 13 + pulse * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(city.x, city.y, 19 + pulse * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.strokeRect(city.x - 7, city.y - 7, 14, 14);
        }
        ctx.beginPath();
        ctx.arc(city.x, city.y, city.active ? sanctuary ? 6 : 5 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        this.drawText(city.lost ? `${label} LOST` : label, city.x + 10, city.y + (sanctuary ? 20 : -8), sanctuary ? 9 : 10, color);
        ctx.restore();
      }
    };

    Game.prototype.drawWarMachineNodes = function () {
      const ctx = this.ctx;
      for (const node of this.wargame.machineNodes) {
        ctx.save();
        const color = node.destroyed ? "rgba(57,255,104,0.22)" : node.core ? this.colors.amber : this.colors.red;
        ctx.strokeStyle = color;
        ctx.fillStyle = node.destroyed ? "rgba(0,0,0,0.35)" : "rgba(255,56,85,0.16)";
        ctx.shadowColor = color;
        ctx.shadowBlur = node.destroyed ? 0 : 10;
        ctx.strokeRect(node.x - 11, node.y - 11, 22, 22);
        ctx.fillRect(node.x - 9, node.y - 9, 18, 18);
        const hp = node.destroyed ? "OFFLINE" : `${Math.ceil((node.hp / node.maxHp) * 100)}%`;
        this.drawText(`${node.name} ${hp}`, node.x - 70, node.y - 18, 10, color);
        ctx.restore();
      }
    };

    Game.prototype.drawWarProjectiles = function () {
      const ctx = this.ctx;
      for (const shot of this.wargame.playerShots) {
        this.drawWarTrail(shot.prevX, shot.prevY, shot.x, shot.y, this.colors.green);
        ctx.save();
        ctx.fillStyle = this.colors.green;
        ctx.shadowColor = this.colors.green;
        ctx.shadowBlur = 8;
        ctx.fillRect(shot.x - 1, shot.y - 5, 3, 9);
        ctx.restore();
      }
      for (const heavy of this.wargame.heavyMissiles) {
        this.drawWarTrail(heavy.prevX, heavy.prevY, heavy.x, heavy.y, this.colors.amber);
        ctx.save();
        ctx.fillStyle = this.colors.amber;
        ctx.shadowColor = this.colors.amber;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(heavy.x, heavy.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const missile of this.wargame.enemyMissiles) {
        const color = missile.type === "hunter" ? this.colors.amber : this.colors.red;
        this.drawWarTrail(missile.prevX, missile.prevY, missile.x, missile.y, color);
        ctx.save();
        ctx.translate(missile.x, missile.y);
        ctx.rotate(Math.atan2(missile.vy, missile.vx) + Math.PI / 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(5, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    };

    Game.prototype.drawWarAircraft = function () {
      const ctx = this.ctx;
      const p = this.wargame.playerAircraft;
      const bankAngle = p.state === "bank_left" ? -0.18 : p.state === "bank_right" ? 0.18 : 0;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(bankAngle);
      this.drawWarAircraftIcon(p, bankAngle);
      ctx.restore();
    };

    Game.prototype.drawWarAircraftIcon = function (p, bankAngle) {
      const ctx = this.ctx;
      this.drawWarAircraftThrust(p, bankAngle);
      ctx.strokeStyle = this.colors.green;
      ctx.fillStyle = "rgba(57,255,104,0.07)";
      ctx.shadowColor = this.colors.green;
      ctx.shadowBlur = p.fireFlash > 0 ? 18 : 10;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(4, -10);
      ctx.lineTo(18, 8);
      ctx.lineTo(7, 5);
      ctx.lineTo(7, 16);
      ctx.lineTo(3, 13);
      ctx.lineTo(2, 22);
      ctx.lineTo(0, 17);
      ctx.lineTo(-2, 22);
      ctx.lineTo(-3, 13);
      ctx.lineTo(-7, 16);
      ctx.lineTo(-7, 5);
      ctx.lineTo(-18, 8);
      ctx.lineTo(-4, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.strokeStyle = this.colors.green;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(0, 14);
      ctx.stroke();
      ctx.fillStyle = this.colors.white;
      ctx.fillRect(-2, -7, 4, 9);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = this.colors.greenSoft || this.colors.green;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-5, -3);
      ctx.lineTo(5, -3);
      ctx.moveTo(-6, 9);
      ctx.lineTo(6, 9);
      ctx.stroke();
      ctx.restore();

      if (p.fireFlash > 0) {
        ctx.save();
        ctx.fillStyle = this.colors.amber;
        ctx.shadowColor = this.colors.amber;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(5, -22);
        ctx.lineTo(-5, -22);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    };

    Game.prototype.drawWarAircraftThrust = function (p, bankAngle) {
      const ctx = this.ctx;
      const speed = Math.hypot(p.vx, p.vy);
      if (speed < 1 || p.thrustAlpha <= 0) return;

      const pulse = 0.74 + Math.sin(p.thrustPhase) * 0.18 + Math.sin(p.thrustPhase * 1.7) * 0.08;
      const length = 8 + pulse * 5;
      const worldX = -p.vx / speed;
      const worldY = -p.vy / speed;
      const cos = Math.cos(bankAngle);
      const sin = Math.sin(bankAngle);
      const localX = cos * worldX + sin * worldY;
      const localY = -sin * worldX + cos * worldY;
      const alpha = Math.min(0.68, p.thrustAlpha * pulse);
      const engines = [-4.5, 4.5];

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "rgba(190,255,198,0.92)";
      ctx.fillStyle = "rgba(190,255,198,0.55)";
      ctx.shadowColor = this.colors.green;
      ctx.shadowBlur = 7;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      for (const engineX of engines) {
        const startX = engineX;
        const startY = 18;
        const tipX = startX + localX * length;
        const tipY = startY + localY * length;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tipX, tipY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    Game.prototype.drawWarExplosions = function () {
      const ctx = this.ctx;
      for (const explosion of this.wargame.explosions) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, explosion.life / 0.36);
        ctx.strokeStyle = explosion.color;
        ctx.shadowColor = explosion.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = explosion.color;
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          ctx.fillRect(explosion.x + Math.cos(a) * explosion.r, explosion.y + Math.sin(a) * explosion.r, 3, 3);
        }
        ctx.restore();
      }
    };

    Game.prototype.drawWarHud = function () {
      const state = this.wargame;
      const selectedPilot = state.selectedPilot;
      const pilot = this.warGamePilotPlayer();
      const machine = CFG.playerById ? CFG.playerById("machine") : null;
      const pilotName = formatWarPilotName(pilot, selectedPilot);
      const callsign = formatWarPilotCallsign(pilot, selectedPilot);
      const lost = state.cities.filter(city => !city.active).length;
      const corePct = Math.max(0, Math.round((state.machineCore.hp / state.machineCore.maxHp) * 100));
      this.panel(22, 20, 312, 166, 0.62);
      this.drawText("WARGAME.EXE", 40, 48, 18, this.colors.green);
      this.drawWarPilotPortrait(pilot, 40, 60, 74, 72);
      this.drawText("PILOT", 128, 72, 11, this.colors.amber);
      this.drawText(pilotName, 128, 92, 15, this.colors.white);
      this.drawText(`CALLSIGN: ${callsign}`, 128, 112, 11, this.colors.white);
      this.drawText("AIRCRAFT: PEACEKEEPER-50", 128, 132, 11, this.colors.white);
      this.drawText(`HUMANITY: ${Math.round(state.humanity)}%`, 40, 158, 12, this.colors.amber);
      this.drawText(`CITIES LOST: ${lost} / ${state.cities.length}`, 178, 158, 12, lost ? this.colors.red : this.colors.green);

      this.panel(352, 20, 256, 72, 0.58);
      this.drawText("WAR CONSOLE", 370, 42, 12, this.colors.white);
      this.drawText(state.lastStatus, 370, 64, 10, this.colors.green);
      if (state.lastStatusDetail) this.drawText(state.lastStatusDetail, 370, 84, 10, this.colors.amber);

      this.panel(646, 20, 292, 112, 0.58);
      this.drawWarMachinePortrait(machine, 846, 42, 70, 70, corePct);
      this.drawText("MACHINE", 664, 51, 15, this.colors.red);
      this.drawText("STATUS: ACTIVE", 664, 75, 11, this.colors.green);
      this.drawText(`CORE: ${corePct}%`, 664, 99, 12, corePct <= 30 ? this.colors.red : this.colors.amber);
      this.drawText(`HEAVY: ${state.heavyCooldown <= 0 ? "READY" : `${state.heavyCooldown.toFixed(1)}S`}`, 664, 123, 11, this.colors.white);

      this.drawText("ARROWS/ZQSD MOVE   SPACE FIRE   X/CTRL HEAVY   ESC TITLE", 480, 520, 11, this.colors.green, "center");
    };

    Game.prototype.warGamePilotPlayer = function () {
      const players = CFG.PLAYERS || [];
      const selectedPilot = this.wargame && this.wargame.selectedPilot;
      if (selectedPilot && selectedPilot.playerId) {
        return this.warGamePilotById(selectedPilot.playerId);
      }
      const session = window.BadPongSession || {};
      if (session.playerId) {
        const sessionPilot = this.warGamePilotById(session.playerId);
        if (sessionPilot) return sessionPilot;
      }
      const playerName = String(session.playerName || window.BadPongCurrentPlayerName || "Fabien").trim();
      const normalizedName = normalizeWarName(warFirstName(playerName));
      return players.find(player => player.id !== "machine" && normalizeWarName(warFirstName(player.name)) === normalizedName)
        || (CFG.playerById && CFG.playerById("fabien"))
        || players.find(player => player.id !== "machine")
        || null;
    };

    Game.prototype.warGamePilotById = function (playerId) {
      const players = CFG.PLAYERS || [];
      if (!playerId) return null;
      const player = (CFG.playerById && CFG.playerById(playerId))
        || players.find(candidate => candidate.id === playerId)
        || null;
      return player && player.id !== "machine" ? player : null;
    };

    Game.prototype.resolveWarGameSelectedPilot = function () {
      if (this.wargamePilotOverride) return Object.assign({}, this.wargamePilotOverride);
      const session = window.BadPongSession || {};
      const player = this.warGamePilotById(session.playerId);
      if (!player) return null;
      const displayName = String(session.pilotDisplayName || player.name || session.playerName || "UNKNOWN").trim();
      const callsign = String(session.pilotCallsign || displayName.replace(/[.\s]+/g, "-").replace(/-+$/g, "")).trim();
      return {
        playerId: player.id,
        displayName: displayName.toUpperCase() || "UNKNOWN",
        callsign: callsign.toUpperCase() || "UNKNOWN"
      };
    };

    Game.prototype.drawWarPilotPortrait = function (player, x, y, w, h) {
      if (this.drawWarPhotoPortrait(player, x, y, w, h, this.colors.green)) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.88)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = this.colors.greenSoft;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.strokeStyle = this.colors.green;
      ctx.fillStyle = "rgba(57,255,104,0.10)";
      ctx.shadowColor = this.colors.green;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 28, 19, Math.PI * 1.08, Math.PI * 1.92);
      ctx.lineTo(x + w / 2 + 21, y + 46);
      ctx.lineTo(x + w / 2 - 21, y + 46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(239,255,242,0.18)";
      ctx.fillRect(x + 21, y + 28, 32, 8);
      ctx.strokeRect(x + 20, y + 27, 34, 10);
      ctx.beginPath();
      ctx.moveTo(x + 54, y + 36);
      ctx.lineTo(x + 63, y + 42);
      ctx.lineTo(x + 63, y + 49);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 24, y + 54);
      ctx.lineTo(x + 50, y + 54);
      ctx.lineTo(x + 60, y + 67);
      ctx.lineTo(x + 14, y + 67);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      for (let yy = y + 8; yy < y + h - 4; yy += 7) {
        ctx.beginPath();
        ctx.moveTo(x + 6, yy);
        ctx.lineTo(x + w - 6, yy);
        ctx.stroke();
      }
      ctx.restore();
    };

    Game.prototype.drawWarMachinePortrait = function (machine, x, y, w, h, corePct) {
      const ctx = this.ctx;
      const glitch = this.wargame ? this.wargame.machineGlitch : 0;
      if (this.drawWarPhotoPortrait(machine, x, y, w, h, corePct <= 30 ? this.colors.red : this.colors.green, { glitch })) return;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.9)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = corePct <= 30 ? this.colors.red : this.colors.greenSoft;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.strokeStyle = corePct <= 30 ? this.colors.red : this.colors.green;
      ctx.fillStyle = "rgba(57,255,104,0.08)";
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = glitch > 0 ? 16 : 9;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 16, y + 12, 38, 38);
      ctx.fillRect(x + 18, y + 14, 34, 34);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillRect(x + 24, y + 24, 8, 7);
      ctx.fillRect(x + 40, y + 24, 8, 7);
      ctx.strokeRect(x + 28, y + 39, 16, 6);
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 30 + i * 4, y + 40, 1, 5);
      ctx.beginPath();
      ctx.moveTo(x + 35, y + 50);
      ctx.lineTo(x + 35, y + 60);
      ctx.moveTo(x + 22, y + 60);
      ctx.lineTo(x + 48, y + 60);
      ctx.stroke();
      if (glitch > 0) {
        ctx.globalAlpha = Math.min(0.7, glitch * 2.2);
        ctx.fillStyle = this.colors.green;
        ctx.fillRect(x + 7, y + 18, 16, 2);
        ctx.fillRect(x + 42, y + 34, 20, 2);
        ctx.fillRect(x + 15, y + 54, 28, 2);
      }
      ctx.restore();
    };

    Game.prototype.drawWarPhotoPortrait = function (player, x, y, w, h, tint, options = {}) {
      const asset = player && this.playerAssets && this.playerAssets[player.assetId || player.id];
      if (!asset || !asset.loaded) return false;
      const ctx = this.ctx;
      const glitch = options.glitch || 0;
      const inset = 4;
      const innerW = w - inset * 2;
      const innerH = h - inset * 2;
      const img = asset.img;
      const scale = Math.max(innerW / img.width, innerH / img.height);
      const iw = Math.ceil(img.width * scale);
      const ih = Math.ceil(img.height * scale);
      const ix = Math.floor(x + inset + (innerW - iw) / 2);
      const iy = Math.floor(y + inset + (innerH - ih) / 2);

      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.9)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = tint;
      ctx.lineWidth = 1;
      ctx.shadowColor = tint;
      ctx.shadowBlur = glitch > 0 ? 16 : 8;
      ctx.strokeRect(x, y, w, h);
      ctx.beginPath();
      ctx.rect(x + inset, y + inset, innerW, innerH);
      ctx.clip();
      ctx.imageSmoothingEnabled = false;
      ctx.filter = "grayscale(1) contrast(1.35) brightness(0.78) sepia(1) hue-rotate(58deg) saturate(3.2)";
      ctx.drawImage(img, ix, iy, iw, ih);
      ctx.filter = "none";
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = tint;
      ctx.fillRect(x + inset, y + inset, innerW, innerH);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = "#000";
      for (let yy = y + inset; yy < y + h - inset; yy += 4) ctx.fillRect(x + inset, yy, innerW, 1);
      if (glitch > 0) {
        ctx.globalAlpha = Math.min(0.68, glitch * 2.1);
        ctx.fillStyle = tint;
        ctx.fillRect(x + 9, y + 18, 24, 2);
        ctx.fillRect(x + 32, y + 44, 30, 2);
      }
      ctx.restore();
      return true;
    };

    Game.prototype.drawWarGameGameOver = function () {
      const ctx = this.ctx;
      const state = this.wargame || { gameOverReason: "aircraft" };
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.width, this.height);
      if (state.gameOverReason === "humanity") {
        this.neon("HUMANITY LOST", this.width / 2, 242, 42, this.colors.red, "center");
        this.neon("GAME OVER", this.width / 2, 300, 58, this.colors.red, "center");
      } else {
        this.neon("GAME OVER", this.width / 2, 284, 72, this.colors.red, "center");
      }
      ctx.restore();
    };

    Game.prototype.warGameVictoryPlayerName = function () {
      const selectedPilot = this.wargame && this.wargame.selectedPilot;
      if (selectedPilot && selectedPilot.displayName) return selectedPilot.displayName;
      const session = window.BadPongSession || {};
      const playerName = String(session.playerName || window.BadPongCurrentPlayerName || "Fabien").trim();
      return playerName || "Fabien";
    };

    Game.prototype.drawWarGameVictory = function () {
      const ctx = this.ctx;
      const playerName = this.warGameVictoryPlayerName();
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.width, this.height);
      this.drawWarConsoleGrid(0.16);
      this.neon("MACHINE CORE DESTROYED", 480, 178, 32, this.colors.green, "center");
      this.drawText("GLOBAL STRIKE ABORTED", 480, 232, 23, this.colors.white, "center");
      this.drawText("HUMANITY STATUS: DAMAGED BUT ALIVE", 480, 272, 19, this.colors.amber, "center");
      this.neon("MISSION COMPLETE", 480, 330, 42, this.colors.green, "center");
      this.drawText(`${playerName} a sauvé l'humanité. Merci.`, 480, 382, 18, this.colors.white, "center");
      this.drawText("ENTRÉE OU ESPACE : RETOUR TITRE", 480, 438, 14, this.colors.white, "center");
      this.drawWarScanlines();
      ctx.restore();
    };

    Game.prototype.drawWarConsoleGrid = function (alpha) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.colors.greenSoft;
      ctx.lineWidth = 1;
      for (let x = 40; x < this.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 70);
        ctx.lineTo(x, this.height - 40);
        ctx.stroke();
      }
      for (let y = 80; y < this.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(28, y);
        ctx.lineTo(this.width - 28, y);
        ctx.stroke();
      }
      ctx.restore();
    };

    Game.prototype.drawWarTrail = function (x1, y1, x2, y2, color) {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    Game.prototype.drawWarGlitch = function (amount) {
      if (!amount) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = Math.min(0.35, amount);
      ctx.fillStyle = this.colors.green;
      for (let i = 0; i < 14; i++) {
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        ctx.fillRect(x, y, 24 + Math.random() * 70, 2);
      }
      ctx.restore();
    };

    Game.prototype.drawWarScanlines = function () {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#000";
      for (let y = 0; y < this.height; y += 4) ctx.fillRect(0, y, this.width, 2);
      ctx.restore();
    };
  }

  function moveWarList(list, dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const item = list[i];
      item.prevX = item.x;
      item.prevY = item.y;
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.life -= dt;
    }
  }

  function drawWarPolyline(ctx, points) {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point[0], point[1]);
      else ctx.lineTo(point[0], point[1]);
    });
    ctx.closePath();
    ctx.stroke();
  }

  function warDistance(a, b) {
    return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
  }

  function warCircleHit(a, b, radius) {
    return warDistance(a, b) <= radius;
  }

  function isWarSanctuary(city) {
    return !!city && (city.type === "sanctuary" || city.isSanctuary);
  }

  function warFirstName(name) {
    const cleanName = String(name || "").trim();
    if (!cleanName) return "";
    return cleanName.split(/\s+/)[0].replace(/[.,;:]+$/g, "");
  }

  function normalizeWarName(name) {
    return warFirstName(name)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function formatWarPilotName(player, selectedPilot) {
    const name = (selectedPilot && selectedPilot.displayName) || warFirstName(player && player.name) || "Fabien";
    const label = name.trim().toUpperCase() || "UNKNOWN";
    return label.length > 16 ? `${label.slice(0, 15)}~` : label;
  }

  function formatWarPilotCallsign(player, selectedPilot) {
    const callsign = (selectedPilot && selectedPilot.callsign) || formatWarPilotName(player, null);
    const label = callsign.trim().toUpperCase() || "UNKNOWN";
    return label.length > 18 ? `${label.slice(0, 17)}~` : label;
  }

  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.installWargame = installWargame;
})();
