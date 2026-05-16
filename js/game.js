(function () {
  "use strict";

  const CFG = window.BadPongConfig;

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.ctx.imageSmoothingEnabled = false;
      this.width = 960;
      this.height = 540;
      this.bounds = { top: 82, bottom: 506, left: 28, right: 932 };
      this.colors = {
        black: "#010201",
        green: "#39ff68",
        greenSoft: "#177c37",
        greenDark: "#061b0c",
        red: "#ff3855",
        white: "#effff2",
        amber: "#ffd04f",
        blue: "#70a8ff",
        cold: "#7c91a8"
      };

      this.audio = new window.ArcadeAudio();
      this.stats = window.FabienStorage.loadStats();
      this.controls = window.FabienStorage.loadControls();
      this.creditIntroText = this.pickCreditIntro();
      this.keys = new Set();
      this.touchActive = false;
      this.touchY = this.height / 2;

      this.screen = "title";
      this.mode = "solo";
      this.tournamentBracketContext = "setup";
      this.titleStartedAt = performance.now() / 1000;
      this.messageText = "Renvoie le volant. Garde la fête debout.";
      this.messageTime = 0;
      this.fullscreenMessageTime = 0;
      this.startupFullscreenPending = true;
      this.lastLoserCommentIndex = -1;
      this.tournamentChampionId = "";
      this.tournamentVictoryStartedAt = 0;
      this.homeButtonFocused = false;

      this.menuIndex = 0;
      this.menuItems = [
        { id: "solo", label: "1 PLAYER" },
        { id: "duel", label: "2 PLAYERS" },
        { id: "tournament", label: "TOURNAMENT" },
        { id: "commands", label: "COMMANDES" },
        { id: "how", label: "HOW TO PLAY" },
        { id: "fullscreen", label: "FULL SCREEN" },
        { id: "credits", label: "CREDITS" }
      ];

      this.photo = new Image();
      this.photoLoaded = false;
      this.tryTitlePhoto([
        "Fabien-home.png",
        "Fabien-Home.png",
        "Faboen-Home.png",
        "Faboen-home.png",
        "Fabien-5.png"
      ], 0);

      this.playerAssets = {};
      this.loadPlayerImages();
      this.resetSelectionState();
      this.resetMatchState();
    }

    loadPlayerImages() {
      for (const player of CFG.PLAYERS) {
        const asset = { img: new Image(), loaded: false, failed: false, file: "" };
        this.playerAssets[player.id] = asset;
        this.tryPlayerImage(player, 0);
      }
    }

    pickCreditIntro() {
      const list = CFG.CREDIT_INTRO_TEXTS || [];
      return list[Math.floor(Math.random() * list.length)] || "Un duel pixelisé à usage festif strictement discutable.";
    }

    tryTitlePhoto(files, index) {
      if (index >= files.length) {
        this.photoLoaded = false;
        return;
      }
      const img = new Image();
      img.onload = () => {
        this.photo = img;
        this.photoLoaded = true;
      };
      img.onerror = () => this.tryTitlePhoto(files, index + 1);
      img.src = `assets/images/${files[index]}`;
    }

    tryPlayerImage(player, index) {
      const asset = this.playerAssets[player.id];
      if (!asset || index >= player.files.length) {
        if (asset) asset.failed = true;
        return;
      }
      const file = player.files[index];
      const img = new Image();
      img.onload = () => {
        asset.img = img;
        asset.loaded = true;
        asset.failed = false;
        asset.file = file;
      };
      img.onerror = () => this.tryPlayerImage(player, index + 1);
      img.src = `assets/images/${file}`;
    }

    resetSelectionState() {
      this.flow = "solo";
      this.playerCursor = 0;
      this.opponentCursor = CFG.PLAYERS.findIndex(player => player.id === "machine");
      this.modeCursor = Math.max(0, CFG.MATCH_MODES.findIndex(mode => mode.id === "speed"));
      this.paddleCursor = 0;
      this.aiDifficultyCursor = this.aiDifficultyIndex("easy");
      this.setupCursor = 0;
      this.tournamentCursor = 0;
      this.commandsCursor = 0;
      this.waitingControl = null;
      this.selected = {
        humanId: "fabien",
        p1Id: "fabien",
        p2Id: "carole",
        opponentId: "machine",
        matchMode: "speed",
        aiDifficulty: "easy",
        p1Paddle: "round",
        p2Paddle: "round",
        tournamentMode: "speed",
        tournamentDifficulty: "normal",
        tournamentPaddle: "round",
        tournamentOpponents: []
      };
      this.randomRoulette = {
        active: false,
        timer: 0,
        tick: 0,
        cursor: 0,
        finalId: null
      };
    }

    resetMatchState() {
      this.left = new window.Paddle("left", 50, "round", this.colors.green);
      this.right = new window.Paddle("right", this.width - 70, "round", this.colors.red);
      this.left.power = 0;
      this.right.power = 0;
      this.leftPlayer = CFG.playerById("fabien");
      this.rightPlayer = CFG.playerById("machine");
      this.leftControl = "p1";
      this.rightControl = "ai";
      this.leftAI = null;
      this.rightAI = null;
      this.shuttles = [];
      this.particles = [];
      this.elapsed = 0;
      this.nextMultiballAt = CFG.MULTIBALL_INTERVAL_SECONDS;
      this.scoreCooldown = 0;
      this.paddleSpeedMultiplier = 1;
      this.matchCountdown = 0;
      this.lastCountdownCue = "";
      this.machineBoosterTimer = 2.5;
      this.scoreToWin = CFG.SCORE_TO_WIN;
      this.currentMatchConfig = null;
      this.currentMatchMode = CFG.matchModeById("speed");
      this.lastScoredSide = "";
      this.endTitle = "";
      this.endMessage = "";
      this.endSub = "";
      this.endWinnerSide = "";
      this.endLoserComment = "";
      this.speedBoosterArmed = { left: false, right: false };
      this.tournament = null;
      this.tournamentBracketContext = "setup";
      this.tournamentChampionId = "";
      this.tournamentVictoryStartedAt = 0;
    }

    key(name) {
      return this.keys.has(name);
    }

    startTitle() {
      this.homeButtonFocused = false;
      this.screen = "title";
      this.titleStartedAt = performance.now() / 1000;
      this.message("Menu principal. Aucun sport doux détecté.", 2);
    }

    startSoloFlow() {
      this.flow = "solo";
      if (this.selected.humanId === "machine") this.selected.humanId = "fabien";
      this.selected.opponentId = "machine";
      this.playerCursor = this.playerIndexInEntries(this.selected.humanId, this.playerSelectEntries("solo"));
      this.screen = "playerSelect";
      this.message("Choisis ton héros d'apéro.", 2);
    }

    startDuelFlow() {
      this.flow = "duel-p1";
      if (this.selected.p1Id === "machine") this.selected.p1Id = "fabien";
      if (this.selected.p2Id === "machine") this.selected.p2Id = "carole";
      this.playerCursor = this.playerIndexInEntries(this.selected.p1Id, this.playerSelectEntries("duel-p1"));
      this.screen = "playerSelect";
      this.message("Joueur 1 choisit son champion.", 2);
    }

    startTournamentFlow() {
      this.flow = "tournament-player";
      if (this.selected.humanId === "machine") this.selected.humanId = "fabien";
      this.playerCursor = this.playerIndexInEntries(this.selected.humanId, this.playerSelectEntries("tournament-player"));
      this.screen = "playerSelect";
      this.message("Sélection tournoi : Fabien par défaut, gloire possible.", 2);
    }

    playerIndex(id) {
      return Math.max(0, CFG.PLAYERS.findIndex(player => player.id === id));
    }

    playerIndexInEntries(id, entries) {
      return Math.max(0, entries.findIndex(player => player.id === id));
    }

    playerSelectEntries(flow = this.flow) {
      if (flow === "solo" || flow === "duel-p1" || flow === "duel-p2" || flow === "tournament-player") {
        return CFG.PLAYERS.filter(player => player.id !== "machine");
      }
      return CFG.PLAYERS;
    }

    firstDuelPlayerIdExcept(id) {
      const entry = this.playerSelectEntries("duel-p2").find(player => player.id !== id);
      return entry ? entry.id : "fabien";
    }

    tournamentSelectablePlayers() {
      return CFG.PLAYERS.filter(player => player.id !== "machine");
    }

    currentPlayerList(options = {}) {
      let list = CFG.PLAYERS;
      if (options.excludeHuman) list = list.filter(player => player.id !== this.selected.humanId);
      return list;
    }

    beginSetup(flow) {
      this.flow = flow;
      if (flow === "solo-setup") this.selected.opponentId = "machine";
      this.setupCursor = 0;
      this.modeCursor = this.modeIndex(this.selected.matchMode);
      this.paddleCursor = this.paddleIndex(this.selected.p1Paddle);
      this.aiDifficultyCursor = this.aiDifficultyIndex(this.selected.aiDifficulty);
      this.screen = "setupSelect";
    }

    modeIndex(id) {
      return Math.max(0, CFG.MATCH_MODES.findIndex(mode => mode.id === id));
    }

    paddleIndex(id) {
      return Math.max(0, CFG.PADDLE_TYPES.findIndex(paddle => paddle.id === id));
    }

    aiDifficultyIndex(id) {
      return Math.max(0, CFG.AI_DIFFICULTY_IDS.indexOf(id));
    }

    randomOpponentChoices() {
      return CFG.PLAYERS.filter(player => player.id !== this.selected.humanId);
    }

    startRandomOpponent() {
      this.randomRoulette.active = true;
      this.randomRoulette.timer = 1.05;
      this.randomRoulette.tick = 0;
      this.randomRoulette.cursor = 0;
      this.audio.play("menu");
      this.message("Tirage au sort. Le destin porte un survêtement fluo.", 2);
    }

    updateRandomRoulette(dt) {
      if (!this.randomRoulette.active) return;
      const choices = this.randomOpponentChoices();
      if (!choices.length) {
        this.randomRoulette.active = false;
        return;
      }
      this.randomRoulette.timer -= dt;
      this.randomRoulette.tick -= dt;
      if (this.randomRoulette.tick <= 0) {
        this.randomRoulette.cursor = Math.floor(Math.random() * choices.length);
        this.randomRoulette.tick = Math.max(0.045, 0.14 * Math.max(0.2, this.randomRoulette.timer));
        this.audio.play("menu");
      }
      if (this.randomRoulette.timer <= 0) {
        const picked = choices[this.randomRoulette.cursor] || choices[0];
        this.selected.opponentId = picked.id;
        this.opponentCursor = this.playerIndex(picked.id);
        this.randomRoulette.active = false;
        this.message(`${picked.name} entre en piste. Volant conseillé.`, 2.8);
        this.beginSetup("solo-setup");
      }
    }

    update(dt) {
      const safeDt = Math.min(0.033, dt);
      this.messageTime = Math.max(0, this.messageTime - safeDt);
      this.fullscreenMessageTime = Math.max(0, this.fullscreenMessageTime - safeDt);

      if (this.screen === "opponentSelect") this.updateRandomRoulette(safeDt);
      if (this.screen !== "play") return;

      if (this.matchCountdown > 0) {
        this.playCountdownCue();
        this.matchCountdown = Math.max(0, this.matchCountdown - safeDt);
        return;
      }

      this.elapsed += safeDt;
      this.scoreCooldown = Math.max(0, this.scoreCooldown - safeDt);
      this.updateAdaptivePaddleSpeed();
      this.updatePaddle(this.left, this.leftControl, this.leftAI, safeDt, "left");
      this.updatePaddle(this.right, this.rightControl, this.rightAI, safeDt, "right");
      this.updateMachineBooster(safeDt);
      this.updateShuttles(safeDt);
      this.updateParticles(safeDt);

      if (this.currentMatchMode.id === "multi" && this.elapsed >= this.nextMultiballAt) {
        if (this.shuttles.length < CFG.MULTIBALL_MAX && !this.isDeucePoint()) {
          this.addShuttle(this.shuttles.length % 2 === 0 ? 1 : -1);
          this.message("MULTIBALLS : un nouveau volant entre sans frapper.", 2.5);
          this.audio.play("bonus");
        }
        this.nextMultiballAt += CFG.MULTIBALL_INTERVAL_SECONDS;
      }
    }

    updateAdaptivePaddleSpeed() {
      const count = Math.max(1, this.shuttles.length);
      const cappedMax = CFG.BASE_SPEED * CFG.PADDLE_SPEED_SHUTTLE_CAP_MULTIPLIER;
      let fastest = CFG.BASE_SPEED;
      for (const shuttle of this.shuttles) {
        fastest = Math.max(fastest, Math.min(cappedMax, shuttle.speed));
      }

      const shuttleBoost = Math.max(0, fastest / CFG.BASE_SPEED - 1) * CFG.PADDLE_SPEED_SHUTTLE_INFLUENCE;
      const multiballBoost = Math.max(0, count - 1) * CFG.PADDLE_SPEED_MULTIBALL_BONUS;
      const multiplier = Math.min(
        CFG.PADDLE_SPEED_MAX_MULTIPLIER,
        Math.max(1, 1 + shuttleBoost + multiballBoost)
      );

      this.paddleSpeedMultiplier = multiplier;
      if (this.left) this.left.speed = this.left.baseSpeed * multiplier;
      if (this.right) this.right.speed = this.right.baseSpeed * multiplier;
    }

    updatePaddle(paddle, role, ai, dt, side) {
      if (role === "ai") {
        if (ai) ai.update(dt, this, side);
        return;
      }

      const up = role === "p1" ? this.controls.p1Up : this.controls.p2Up;
      const down = role === "p1" ? this.controls.p1Down : this.controls.p2Down;
      if (this.touchActive && role === "p1") {
        paddle.moveToward(this.touchY, dt, paddle.speed * 1.35, this.bounds);
      } else {
        paddle.updateManual(dt, this.key(up), this.key(down), this.bounds);
      }
    }

    sideForRole(role) {
      if (this.leftControl === role) return "left";
      if (this.rightControl === role) return "right";
      return "";
    }

    controlsForRole(role) {
      if (role === "p1") return { up: this.controls.p1Up, down: this.controls.p1Down };
      if (role === "p2") return { up: this.controls.p2Up, down: this.controls.p2Down };
      return { up: "", down: "" };
    }

    boostComboLabelForSide(side) {
      const role = side === "left" ? this.leftControl : this.rightControl;
      const controls = this.controlsForRole(role);
      if (!controls.up || !controls.down) return "AUTO";
      return `${this.keyLabel(controls.up)}+${this.keyLabel(controls.down)}`;
    }

    currentBaseSpeed() {
      if (this.currentMatchMode && this.currentMatchMode.id === "normal") {
        return CFG.BASE_SPEED * (CFG.BORING_INITIAL_SPEED_MULTIPLIER || 1.5);
      }
      return CFG.BASE_SPEED;
    }

    speedBoostMultiplier() {
      if (this.currentMatchMode && this.currentMatchMode.id === "normal") {
        return CFG.BORING_SPEED_BOOST_MULTIPLIER || 3;
      }
      return CFG.SPEED_BOOST_MULTIPLIER;
    }

    speedBoostLabel() {
      const multiplier = this.speedBoostMultiplier();
      if (this.currentMatchMode && this.currentMatchMode.id === "normal") {
        return `+${Math.round((multiplier - 1) * 100)}%`;
      }
      return `x${multiplier}`;
    }

    tryArmSpeedBoosterCombo(role, key) {
      const controls = this.controlsForRole(role);
      if (key !== controls.up && key !== controls.down) return false;
      if (!this.key(controls.up) || !this.key(controls.down)) return false;
      const side = this.sideForRole(role);
      if (!side) return false;
      this.armSpeedBooster(side);
      return true;
    }

    updateMachineBooster(dt) {
      const machineSide = this.rightControl === "ai" && this.rightPlayer && this.isMachinePlayerId(this.rightPlayer.id)
        ? "right"
        : this.leftControl === "ai" && this.leftPlayer && this.isMachinePlayerId(this.leftPlayer.id)
          ? "left"
          : "";
      if (!machineSide) return;

      const paddle = machineSide === "left" ? this.left : this.right;
      if (!paddle || this.speedBoosterArmed[machineSide] || (paddle.power || 0) < 100) {
        this.machineBoosterTimer = Math.max(0.8, this.machineBoosterTimer || 1.4);
        return;
      }

      this.machineBoosterTimer -= dt;
      if (this.machineBoosterTimer > 0) return;
      this.armSpeedBooster(machineSide);
      this.machineBoosterTimer = 4 + Math.random() * 6;
    }

    updateShuttles(dt) {
      for (const shuttle of this.shuttles) {
        shuttle.update(dt, this);
        this.collidePaddle(shuttle, this.left, "left");
        this.collidePaddle(shuttle, this.right, "right");

        if (shuttle.x + shuttle.r < 0) this.scorePoint("right", shuttle);
        if (shuttle.x - shuttle.r > this.width) this.scorePoint("left", shuttle);
        if (this.screen !== "play") return;
      }
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }

    collidePaddle(shuttle, paddle, side) {
      if (side === "left" && shuttle.vx >= 0) return;
      if (side === "right" && shuttle.vx <= 0) return;
      if (!this.circleRect(shuttle.x, shuttle.y, shuttle.r, paddle.x, paddle.y, paddle.w, paddle.h)
        && !this.sweptCircleRect(shuttle, paddle)) return;

      const dir = side === "left" ? 1 : -1;
      const speedBoostArrived = shuttle.speedBoostActive && shuttle.speedBoostTarget === side;
      if (speedBoostArrived) this.deactivateSpeedBoost(shuttle, side);
      shuttle.x = side === "left" ? paddle.x + paddle.w + shuttle.r : paddle.x - shuttle.r;
      const impact = paddle.impact(shuttle);
      let speed = Math.max(CFG.BASE_SPEED, shuttle.speed) * impact.speedFactor;

      if (this.currentMatchMode.id === "speed") {
        shuttle.speedMultiplier = Math.min(CFG.SPEEDUP_MAX_MULTIPLIER, shuttle.speedMultiplier * CFG.SPEEDUP_PADDLE_HIT * impact.speedFactor);
        speed = shuttle.baseSpeed * shuttle.speedMultiplier;
      }

      const vxBase = Math.max(CFG.BASE_SPEED * 0.42, speed * (1 - Math.min(0.58, Math.abs(impact.angleFactor) * 0.25)));
      shuttle.vx = dir * vxBase;
      shuttle.vy = impact.angleFactor * speed * 0.72;
      shuttle.normalizeTo(speed);
      if (this.speedBoosterArmed[side] && !shuttle.speedBoostActive) {
        this.activateSpeedBoostShot(shuttle, side, speed);
        this.speedBoosterArmed[side] = false;
      }
      this.chargeSpeedBooster(side, 8);
      this.explosion(shuttle.x, shuttle.y, side === "left" ? this.colors.green : this.colors.red, 8);
      this.audio.play("bounce");
    }

    sweptCircleRect(shuttle, paddle) {
      const dx = shuttle.x - shuttle.prevX;
      const dy = shuttle.y - shuttle.prevY;
      const steps = Math.max(2, Math.ceil(Math.hypot(dx, dy) / Math.max(4, shuttle.r)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = shuttle.prevX + dx * t;
        const y = shuttle.prevY + dy * t;
        if (this.circleRect(x, y, shuttle.r, paddle.x, paddle.y, paddle.w, paddle.h)) return true;
      }
      return false;
    }

    onWallHit(shuttle) {
      if (this.currentMatchMode.id === "speed") {
        shuttle.speedMultiplier = Math.min(CFG.SPEEDUP_MAX_MULTIPLIER, shuttle.speedMultiplier * CFG.SPEEDUP_WALL_HIT);
        const normalSpeed = shuttle.baseSpeed * shuttle.speedMultiplier;
        if (shuttle.speedBoostActive) {
          shuttle.speedBoostBaseSpeed = normalSpeed;
          shuttle.normalizeTo(normalSpeed * CFG.SPEED_BOOST_MULTIPLIER);
        } else {
          shuttle.normalizeTo(normalSpeed);
        }
      }
      this.audio.play("bounce");
    }

    scorePoint(side, shuttle) {
      if (shuttle.safeTime > 0) return;
      const scoringPaddle = side === "left" ? this.left : this.right;
      const losingSide = side === "left" ? "right" : "left";
      const serveDir = losingSide === "left" ? -1 : 1;
      this.clearSpeedBoosterState();

      if (this.scoreCooldown <= 0) {
        scoringPaddle.score += 1;
        this.chargeSpeedBooster(side, 18);
        this.lastScoredSide = side;
        this.message(`${this.sideName(side)} marque. Premier à ${this.scoreToWin}.`, 2.2);
        this.audio.play("validate");
        this.scoreCooldown = CFG.SCORE_COOLDOWN_SECONDS;
      }

      shuttle.reset(this.width / 2, this.height / 2, serveDir, this.currentBaseSpeed());
      if (scoringPaddle.score >= this.scoreToWin) this.finishMatch(side);
    }

    finishMatch(winnerSide) {
      winnerSide = this.applyFabienBirthdayRule(winnerSide);
      const loserSide = winnerSide === "left" ? "right" : "left";
      this.endWinnerSide = winnerSide;
      this.endTitle = `${this.sideName(winnerSide)} GAGNE`;
      this.endMessage = winnerSide === "left"
        ? "L'apéro tient debout. Le volant aussi, globalement."
        : "La Machine sourit. Quelqu'un a rangé les chips trop tôt.";
      this.endSub = `${this.sideName(winnerSide)} ${this.sideScore(winnerSide)} - ${this.sideScore(loserSide)} ${this.sideName(loserSide)}`;
      this.prepareLoserComment(loserSide);
      this.audio.play(winnerSide === "left" ? "win" : "lose");

      if (this.currentMatchConfig && this.currentMatchConfig.tournamentMatch) {
        this.recordTournamentMatch(winnerSide);
        if (this.tournament && this.tournament.result && this.tournament.result.championId) {
          this.showTournamentVictory();
        } else {
          this.showTournamentBracket("afterMatch");
        }
        return;
      } else {
        this.stats = window.FabienStorage.recordMatch(winnerSide);
      }
      this.screen = "matchEnd";
    }

    applyFabienBirthdayRule(winnerSide) {
      if (!CFG.MODE_ANNIVERSAIRE_FABIEN) return winnerSide;
      const leftIsFabien = this.isFabienPlayer(this.leftPlayer, this.currentMatchConfig && this.currentMatchConfig.leftPlayerId);
      const rightIsFabien = this.isFabienPlayer(this.rightPlayer, this.currentMatchConfig && this.currentMatchConfig.rightPlayerId);
      const leftIsMachine = this.isMachinePlayer(this.leftPlayer, this.currentMatchConfig && this.currentMatchConfig.leftPlayerId);
      const rightIsMachine = this.isMachinePlayer(this.rightPlayer, this.currentMatchConfig && this.currentMatchConfig.rightPlayerId);

      if (leftIsFabien && rightIsMachine) return this.forceMatchWinner("right");
      if (rightIsFabien && leftIsMachine) return this.forceMatchWinner("left");
      return winnerSide;
    }

    forceMatchWinner(winnerSide) {
      const loserSide = winnerSide === "left" ? "right" : "left";
      const winner = winnerSide === "left" ? this.left : this.right;
      const loser = loserSide === "left" ? this.left : this.right;
      winner.score = Math.max(winner.score || 0, this.scoreToWin);
      loser.score = Math.min(loser.score || 0, Math.max(0, this.scoreToWin - 1));
      return winnerSide;
    }

    isFabienPlayer(player, id) {
      return this.normalizedPlayerLabel(id) === "fabien"
        || this.normalizedPlayerLabel(player && player.id) === "fabien"
        || this.normalizedPlayerLabel(player && player.name) === "fabien";
    }

    isMachinePlayer(player, id) {
      const candidateId = id || (player && player.id);
      if (this.isMachinePlayerId(candidateId)) return true;
      if (player && (player.baseId === "machine" || player.assetId === "machine")) return true;
      const name = this.normalizedPlayerLabel(player && player.name);
      return name === "machine" || name === "lamachine" || name === "ordinateur" || name === "ia" || name === "cpu";
    }

    normalizedPlayerLabel(value) {
      return String(value || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();
    }

    recordTournamentMatch(winnerSide) {
      if (!this.tournament || !this.currentMatchConfig) return;
      const item = this.currentMatchConfig.tournamentMatch;
      const leftScore = this.left.score;
      const rightScore = this.right.score;
      item.scoreA = leftScore;
      item.scoreB = rightScore;
      item.winner = winnerSide === "left" ? this.currentMatchConfig.leftPlayerId : this.currentMatchConfig.rightPlayerId;
      item.status = "completed";
      item.completedAt = Date.now();
      this.tournament.completedTournamentMatches.push(item.id);
      const next = this.setNextTournamentMatch();
      if (!next) this.finishTournament();
    }

    advanceTournament() {
      if (!this.tournament) return this.startTitle();
      if (this.tournament.result && this.tournament.result.championId) return this.startTitle();
      this.startTournamentMatch();
    }

    finishTournament() {
      if (!this.tournament || this.tournament.result) return;
      const final = this.tournament.rounds[this.tournament.rounds.length - 1][0];
      const championId = final ? final.winner : null;
      if (!championId) return;

      const humanId = this.tournament.humanId;
      const completed = this.tournament.matches.filter(match => match.status === "completed");
      let totalHuman = 0;
      let totalOpponents = 0;
      let best = null;
      let worst = null;

      for (const match of completed) {
        const playerA = this.tournamentSlotValue(match, "A");
        const playerB = this.tournamentSlotValue(match, "B");
        if (playerA.id !== humanId && playerB.id !== humanId) continue;
        const humanScore = playerA.id === humanId ? match.scoreA : match.scoreB;
        const otherScore = playerA.id === humanId ? match.scoreB : match.scoreA;
        const otherId = playerA.id === humanId ? playerB.id : playerA.id;
        const diff = humanScore - otherScore;
        totalHuman += humanScore || 0;
        totalOpponents += otherScore || 0;
        if (!best || diff > best.diff) best = { id: otherId, diff };
        if (!worst || diff < worst.diff) worst = { id: otherId, diff };
      }

      this.tournament.result = {
        championId,
        championName: this.tournamentPlayerById(championId).name,
        beaten: championId === humanId ? Math.max(0, this.tournament.participants.length - 1) : 0,
        lost: championId === humanId ? 0 : 1,
        totalHuman,
        totalOpponents,
        best,
        worst,
        won: championId === humanId
      };
      this.stats = window.FabienStorage.recordTournament(this.tournament.result);
      this.audio.play(this.tournament.result.won ? "win" : "lose");
    }

    showTournamentVictory() {
      if (!this.tournament || !this.tournament.result || !this.tournament.result.championId) return this.startTitle();
      this.tournamentChampionId = this.tournament.result.championId;
      this.tournamentVictoryStartedAt = performance.now() / 1000;
      this.screen = "tournamentVictory";
      if (this.audio.playPeplum) this.audio.playPeplum();
      else this.audio.play("win");
    }

    sideName(side) {
      const player = side === "left" ? this.leftPlayer : this.rightPlayer;
      return player ? player.name : side.toUpperCase();
    }

    loserName(side) {
      const name = this.sideName(side);
      return name && String(name).trim() ? String(name).trim() : "Joueur";
    }

    prepareLoserComment(loserSide) {
      const name = this.loserName(loserSide);
      const comments = CFG.LOSER_COMMENTS || [];
      if (!comments.length) {
        this.endLoserComment = `${name}, la partie a choisi son camp. C'était audacieux.`;
        return;
      }

      let index = Math.floor(Math.random() * comments.length);
      if (comments.length > 1 && index === this.lastLoserCommentIndex) {
        index = (index + 1 + Math.floor(Math.random() * (comments.length - 1))) % comments.length;
      }
      this.lastLoserCommentIndex = index;
      this.endLoserComment = comments[index].replaceAll("{prenom}", name);
    }

    sideScore(side) {
      return side === "left" ? this.left.score : this.right.score;
    }

    isDeucePoint() {
      return this.left.score === CFG.SCORE_TO_WIN - 1 && this.right.score === CFG.SCORE_TO_WIN - 1;
    }

    circleRect(cx, cy, r, rx, ry, rw, rh) {
      const closestX = Math.max(rx, Math.min(cx, rx + rw));
      const closestY = Math.max(ry, Math.min(cy, ry + rh));
      const dx = cx - closestX;
      const dy = cy - closestY;
      return dx * dx + dy * dy <= r * r;
    }

    predictY(shuttle, side) {
      if (!shuttle) return this.height / 2;
      const targetX = side === "right" ? this.right.x : this.left.x + this.left.w;
      const time = (targetX - shuttle.x) / Math.max(1, Math.abs(shuttle.vx)) * (shuttle.vx < 0 ? -1 : 1);
      if (time < 0 || !Number.isFinite(time)) return shuttle.y;
      let y = shuttle.y + shuttle.vy * time;
      const top = this.bounds.top + shuttle.r;
      const bottom = this.bounds.bottom - shuttle.r;
      const span = bottom - top;
      while (y < top || y > bottom) {
        if (y < top) y = top + (top - y);
        if (y > bottom) y = bottom - (y - bottom);
      }
      return Math.max(top, Math.min(bottom, y + (Math.random() - 0.5) * Math.min(12, span * 0.03)));
    }

    addShuttle(dir) {
      const shuttle = new window.Shuttle(this.width / 2, this.height / 2, dir || (Math.random() > 0.5 ? 1 : -1), this.currentBaseSpeed());
      shuttle.vy += (Math.random() - 0.5) * 90;
      this.shuttles.push(shuttle);
      return shuttle;
    }

    beginMatch(config) {
      this.mode = config.kind || "solo";
      this.currentMatchConfig = Object.assign({}, config);
      this.currentMatchMode = CFG.matchModeById(config.modeId || "speed");
      this.scoreToWin = config.scoreToWin || CFG.SCORE_TO_WIN;
      this.leftPlayer = this.resolvePlayerForMatch(config.leftPlayerId);
      this.rightPlayer = this.resolvePlayerForMatch(config.rightPlayerId);
      this.left = new window.Paddle("left", 50, config.leftPaddleType || "round", this.colors.green);
      this.right = new window.Paddle("right", this.width - 70, config.rightPaddleType || "round", this.colors.red);
      this.left.power = 0;
      this.right.power = 0;
      this.leftControl = config.leftControl || "p1";
      this.rightControl = config.rightControl || "ai";
      this.leftAI = this.leftControl === "ai" ? new window.LocalPongAI(this.left, config.leftDifficulty || this.leftPlayer.difficulty) : null;
      this.rightAI = this.rightControl === "ai" ? new window.LocalPongAI(this.right, config.rightDifficulty || this.rightPlayer.difficulty) : null;
      this.shuttles = [];
      this.particles = [];
      this.elapsed = 0;
      this.nextMultiballAt = CFG.MULTIBALL_INTERVAL_SECONDS;
      this.scoreCooldown = 0;
      this.paddleSpeedMultiplier = 1;
      this.matchCountdown = 4;
      this.lastCountdownCue = "";
      this.machineBoosterTimer = 1.8 + Math.random() * 2.8;
      this.lastScoredSide = "";
      this.speedBoosterArmed = { left: false, right: false };
      this.addShuttle(Math.random() > 0.5 ? 1 : -1);
      this.screen = "play";
      this.message(`${this.leftPlayer.name} vs ${this.rightPlayer.name} - ${this.currentMatchMode.label}`, 3);
      this.audio.play("validate");
    }

    startSoloMatch() {
      this.selected.opponentId = "machine";
      this.beginMatch({
        kind: "solo",
        leftPlayerId: this.selected.humanId,
        rightPlayerId: "machine",
        leftControl: "p1",
        rightControl: "ai",
        modeId: this.selected.matchMode,
        leftPaddleType: this.selected.p1Paddle,
        rightPaddleType: "round",
        rightDifficulty: this.selected.aiDifficulty
      });
    }

    startDuelMatch() {
      if (this.selected.p1Id === "machine") this.selected.p1Id = "fabien";
      if (this.selected.p2Id === "machine") this.selected.p2Id = this.firstDuelPlayerIdExcept(this.selected.p1Id);
      this.beginMatch({
        kind: "duel",
        leftPlayerId: this.selected.p1Id,
        rightPlayerId: this.selected.p2Id,
        leftControl: "p1",
        rightControl: "p2",
        modeId: this.selected.matchMode,
        leftPaddleType: this.selected.p1Paddle,
        rightPaddleType: this.selected.p2Paddle
      });
    }

    buildTournament() {
      const participants = this.normalizeTournamentParticipants();
      if (participants.length < 1) {
        this.message("Il faut au moins un joueur pour faire un tableau. Même absurde.", 2.6);
        return;
      }

      const bracket = createTournamentBracket(participants);

      this.tournament = {
        humanId: this.selected.humanId,
        humanParticipants: participants,
        participants: bracket.participants,
        playersById: bracket.playersById,
        bracketSize: bracket.bracketSize,
        machineCount: bracket.machineCount,
        rounds: bracket.rounds,
        matches: bracket.rounds.flat(),
        modeId: this.selected.tournamentMode,
        aiDifficulty: this.selected.tournamentDifficulty,
        paddleType: this.selected.tournamentPaddle,
        currentMatchId: null,
        completedTournamentMatches: [],
        result: null
      };
      this.setNextTournamentMatch();
      this.showTournamentBracket("setup");
    }

    normalizeTournamentParticipants() {
      const ids = [];
      const add = id => {
        const player = CFG.playerById(id);
        if (!player || player.id === "machine" || ids.includes(player.id)) return;
        ids.push(player.id);
      };
      add(this.selected.humanId);
      this.selected.tournamentOpponents.forEach(add);
      return ids;
    }

    randomTournamentOpponents(count) {
      const pool = this.tournamentSelectablePlayers()
        .filter(player => player.id !== this.selected.humanId)
        .map(player => player.id)
        .sort(() => Math.random() - 0.5);
      return pool.slice(0, Math.min(count, pool.length));
    }

    findTournamentMatch(id) {
      return this.tournament && this.tournament.matches
        ? this.tournament.matches.find(match => match.id === id)
        : null;
    }

    tournamentPlayerById(id) {
      if (this.tournament && this.tournament.playersById && this.tournament.playersById[id]) {
        return this.tournament.playersById[id];
      }
      return CFG.playerById(id);
    }

    resolvePlayerForMatch(id) {
      return this.tournamentPlayerById(id);
    }

    isMachinePlayerId(id) {
      if (!id) return false;
      const player = this.tournament && this.tournament.playersById ? this.tournament.playersById[id] : null;
      return id === "machine" || /^machine-\d+$/.test(String(id)) || (player && player.baseId === "machine");
    }

    tournamentSlotValue(match, slot) {
      const playerKey = slot === "A" ? "playerA" : "playerB";
      const sourceKey = slot === "A" ? "sourceA" : "sourceB";
      if (!match) return { resolved: false, id: null, label: "À définir" };
      if (!match[sourceKey]) {
        return {
          resolved: !!match[playerKey],
          id: match[playerKey] || null,
          label: match[playerKey] ? this.tournamentPlayerById(match[playerKey]).name : "À définir"
        };
      }
      const source = this.findTournamentMatch(match[sourceKey]);
      if (!source || source.status !== "completed") {
        return { resolved: false, id: null, label: `Gagnant ${match[sourceKey]}` };
      }
      return {
        resolved: !!source.winner,
        id: source.winner || null,
        label: source.winner ? this.tournamentPlayerById(source.winner).name : `Gagnant ${match[sourceKey]}`
      };
    }

    tournamentMatchLabel(match) {
      const a = this.tournamentSlotValue(match, "A");
      const b = this.tournamentSlotValue(match, "B");
      return `${match.id} ${a.label} vs ${b.label}`;
    }

    setNextTournamentMatch() {
      if (!this.tournament) return null;
      for (const match of this.tournament.matches) {
        if (match.status === "current") match.status = "upcoming";
      }
      const next = this.tournament.matches.find(match => {
        if (match.status !== "upcoming") return false;
        const a = this.tournamentSlotValue(match, "A");
        const b = this.tournamentSlotValue(match, "B");
        return a.resolved && b.resolved && !!a.id && !!b.id;
      });
      this.tournament.currentMatchId = next ? next.id : null;
      if (next) next.status = "current";
      return next || null;
    }

    getCurrentTournamentMatch() {
      if (!this.tournament || !this.tournament.currentMatchId) return null;
      return this.findTournamentMatch(this.tournament.currentMatchId);
    }

    showTournamentBracket(context = "afterMatch") {
      this.tournamentBracketContext = context;
      this.screen = "tournamentBracket";
      this.audio.play("menu");
    }

    startTournamentMatch() {
      if (!this.tournament) return this.startTitle();
      const item = this.getCurrentTournamentMatch() || this.setNextTournamentMatch();
      if (!item) return this.showTournamentBracket("afterMatch");
      const playerA = this.tournamentSlotValue(item, "A");
      const playerB = this.tournamentSlotValue(item, "B");
      if (!playerA.resolved || !playerB.resolved || !playerA.id || !playerB.id) {
        this.setNextTournamentMatch();
        return this.showTournamentBracket("afterMatch");
      }
      item.status = "current";
      this.tournament.currentMatchId = item.id;
      const leftIsMachine = this.isMachinePlayerId(playerA.id);
      const rightIsMachine = this.isMachinePlayerId(playerB.id);
      this.beginMatch({
        kind: "tournament",
        leftPlayerId: playerA.id,
        rightPlayerId: playerB.id,
        leftControl: leftIsMachine ? "ai" : "p1",
        rightControl: rightIsMachine ? "ai" : "p2",
        modeId: this.tournament.modeId,
        leftPaddleType: leftIsMachine ? "round" : this.tournament.paddleType,
        rightPaddleType: rightIsMachine ? "round" : this.tournament.paddleType,
        leftDifficulty: leftIsMachine ? "normal" : undefined,
        rightDifficulty: rightIsMachine ? "normal" : undefined,
        scoreToWin: CFG.SCORE_TO_WIN,
        tournamentMatch: item
      });
    }

    restartCurrentMatch() {
      if (this.currentMatchConfig) this.beginMatch(this.currentMatchConfig);
      else this.startTitle();
    }

    quitMatch() {
      this.message("Partie quittée. La raquette nie toute responsabilité.", 2);
      this.startTitle();
    }

    cycleRacketForRole(role) {
      const side = this.leftControl === role ? "left" : this.rightControl === role ? "right" : "";
      if (!side) return false;
      const paddle = side === "left" ? this.left : this.right;
      const index = this.paddleIndex(paddle.typeId);
      const next = CFG.PADDLE_TYPES[wrap(index + 1, CFG.PADDLE_TYPES.length)];
      paddle.setType(next.id);
      paddle.clamp(this.bounds);
      if (this.currentMatchConfig) {
        if (side === "left") this.currentMatchConfig.leftPaddleType = next.id;
        else this.currentMatchConfig.rightPaddleType = next.id;
      }
      if (role === "p1") this.selected.p1Paddle = next.id;
      if (role === "p2") this.selected.p2Paddle = next.id;
      this.message(`${role.toUpperCase()} change de raquette : ${next.label}.`, 2);
      this.audio.play("menu");
      return true;
    }

    pauseActionButtons() {
      const defs = [];
      if (this.sideForRole("p1")) defs.push({ action: "racket-p1", label: "RAQ J1", w: 138, color: this.colors.amber });
      if (this.sideForRole("p2")) defs.push({ action: "racket-p2", label: "RAQ J2", w: 138, color: this.colors.amber });
      if (this.currentMatchConfig && this.currentMatchConfig.tournamentMatch) {
        defs.push({ action: "bracket", label: "TABLEAU DU TOURNOI", w: 228, color: this.colors.green });
      }

      const gap = 14;
      const totalW = defs.reduce((sum, item) => sum + item.w, 0) + Math.max(0, defs.length - 1) * gap;
      let x = (this.width - totalW) / 2;
      return defs.map(item => {
        const button = Object.assign({ x, y: 356, h: 30 }, item);
        x += item.w + gap;
        return button;
      });
    }

    homeButtonRect() {
      return { x: this.width - 140, y: 42, w: 96, h: 26 };
    }

    shouldShowHomeButton() {
      return this.screen !== "title" && this.screen !== "play";
    }

    handleHomeButtonPointer(x, y) {
      if (!this.shouldShowHomeButton()) return false;
      const rect = this.homeButtonRect();
      if (!inside(x, y, rect.x, rect.y, rect.w, rect.h)) return false;
      this.audio.play("validate");
      this.startTitle();
      return true;
    }

    handleHomeButtonKey(key) {
      if (!this.shouldShowHomeButton()) return false;
      if (this.homeButtonFocused) {
        if (key === "Enter") {
          this.audio.play("validate");
          this.startTitle();
          return true;
        }
        if (this.isDirectionalKey(key)) {
          this.homeButtonFocused = false;
          this.audio.play("menu");
          return true;
        }
        return false;
      }
      if (!this.shouldFocusHomeButtonFromKey(key)) return false;
      this.homeButtonFocused = true;
      this.audio.play("menu");
      return true;
    }

    isDirectionalKey(key) {
      return key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight"
        || key === "z" || key === "s" || key === "q" || key === "d";
    }

    shouldFocusHomeButtonFromKey(key) {
      if (key !== "ArrowUp" && key !== "z") {
        const passiveScreens = ["how", "credits", "tournamentBracket", "tournamentVictory", "tournamentIntro", "matchEnd", "tournamentEnd", "pause"];
        return passiveScreens.includes(this.screen) && this.isDirectionalKey(key);
      }
      if (this.screen === "commands") return this.commandsCursor === 0;
      if (this.screen === "setupSelect" || this.screen === "tournamentSetup") return this.setupCursor === 0;
      if (this.screen === "playerSelect") return this.playerCursor < 4;
      if (this.screen === "opponentSelect") return this.opponentCursor < 4;
      if (this.screen === "tournamentOpponents") return this.tournamentCursor < 4;
      return ["how", "credits", "tournamentBracket", "tournamentVictory", "tournamentIntro", "matchEnd", "tournamentEnd", "pause"].includes(this.screen);
    }

    handlePauseAction(action) {
      if (action === "racket-p1") return this.cycleRacketForRole("p1");
      if (action === "racket-p2") return this.cycleRacketForRole("p2");
      if (action === "bracket" && this.currentMatchConfig && this.currentMatchConfig.tournamentMatch) {
        this.showTournamentBracket("pause");
        return true;
      }
      return false;
    }

    handlePointerDown(x, y) {
      if (this.screen === "title") return this.handleTitlePointer(x, y);
      if (this.handleHomeButtonPointer(x, y)) return true;
      if (this.screen === "playerSelect") return this.handlePlayerSelectPointer(x, y);
      if (this.screen === "opponentSelect") return this.handleOpponentSelectPointer(x, y);
      if (this.screen === "setupSelect") return this.handleSetupPointer(x, y);
      if (this.screen === "tournamentOpponents") return this.handleTournamentOpponentsPointer(x, y);
      if (this.screen === "tournamentSetup") return this.handleTournamentSetupPointer(x, y);
      if (this.screen === "tournamentBracket") return this.handleTournamentBracketPointer(x, y);
      if (this.screen === "tournamentVictory") return this.handleTournamentVictoryPointer(x, y);
      if (this.screen === "tournamentIntro") {
        if (inside(x, y, 145, 130, 670, 292)) this.startTournamentMatch();
        return true;
      }
      if (this.screen === "pause") return this.handlePausePointer(x, y);
      if (this.screen !== "play") return false;
      if (inside(x, y, 694, 511, 64, 22)) {
        this.quitMatch();
        return true;
      }
      if (inside(x, y, 766, 511, 76, 22)) return this.cycleRacketForRole("p1");
      if (this.rightControl === "p2" && inside(x, y, 850, 511, 76, 22)) return this.cycleRacketForRole("p2");
      return false;
    }

    handleTitlePointer(x, y) {
      const index = menuIndexAt(x, y, 72, 219, 286, 28, 31, this.menuItems.length);
      if (index < 0) return false;
      this.menuIndex = index;
      this.handleTitleKey("Enter");
      return true;
    }

    handlePlayerSelectPointer(x, y) {
      const entries = this.playerSelectEntries();
      const index = gridIndexAt(x, y, entries.length);
      if (index < 0) return false;
      this.playerCursor = index;
      this.handlePlayerSelectKey("Enter");
      return true;
    }

    handleOpponentSelectPointer(x, y) {
      const total = CFG.PLAYERS.length + 1;
      const index = gridIndexAt(x, y, total);
      if (index < 0) return false;
      this.opponentCursor = index;
      this.handleOpponentSelectKey("Enter");
      return true;
    }

    handleSetupPointer(x, y) {
      const row = optionRowAt(x, y, 184, 72, 3);
      if (row >= 0) {
        this.setupCursor = row;
        if (x > 430) this.changeSetupValue(1);
        return true;
      }
      if (inside(x, y, 390, 398, 180, 34)) {
        if (this.flow === "solo-setup") this.startSoloMatch();
        else this.startDuelMatch();
        return true;
      }
      return false;
    }

    handleTournamentOpponentsPointer(x, y) {
      const players = this.tournamentSelectablePlayers();
      const total = players.length + 2;
      const index = gridIndexAt(x, y, total);
      if (index < 0) return false;
      this.tournamentCursor = index;
      this.handleTournamentOpponentsKey("Enter");
      return true;
    }

    handleTournamentSetupPointer(x, y) {
      const row = optionRowAt(x, y, 178, 74, 3);
      if (row >= 0) {
        this.setupCursor = row;
        if (x > 430) this.changeTournamentSetup(1);
        return true;
      }
      if (inside(x, y, 300, 438, 360, 36)) {
        this.buildTournament();
        return true;
      }
      return false;
    }

    handleTournamentBracketPointer(x, y) {
      if (!this.tournament) return false;
      if (this.tournamentBracketContext === "pause") {
        if (inside(x, y, 330, 474, 300, 34)) {
          this.screen = "play";
          this.audio.play("validate");
          return true;
        }
        return false;
      }
      if (inside(x, y, 320, 474, 320, 34)) {
        if (this.tournament.result && this.tournament.result.championId) this.startTitle();
        else this.startTournamentMatch();
        return true;
      }
      return false;
    }

    handlePausePointer(x, y) {
      const buttons = this.pauseActionButtons();
      for (const button of buttons) {
        if (inside(x, y, button.x, button.y, button.w, button.h)) {
          return this.handlePauseAction(button.action);
        }
      }
      return false;
    }

    handleTournamentVictoryPointer(x, y) {
      if (inside(x, y, 350, 488, 260, 34)) {
        this.startTitle();
        return true;
      }
      return false;
    }

    chargeSpeedBooster(side, amount) {
      const paddle = side === "left" ? this.left : this.right;
      const before = paddle.power || 0;
      paddle.power = Math.min(100, before + amount);
      if (before < 100 && paddle.power >= 100) {
        const combo = this.boostComboLabelForSide(side);
        const suffix = combo === "AUTO" ? " Activation automatique." : ` Appuie ${combo}.`;
        this.message(`${this.sideName(side)} prêt pour ${CFG.FATAL_BOOSTER_LABEL}.${suffix}`, 2.4);
      }
    }

    activateSpeedBoostShot(shuttle, side, normalSpeed) {
      const target = side === "left" ? "right" : "left";
      const baseSpeed = Math.max(1, normalSpeed || shuttle.speed);
      const multiplier = this.speedBoostMultiplier();
      shuttle.speedBoostActive = true;
      shuttle.speedBoostOwner = side;
      shuttle.speedBoostTarget = target;
      shuttle.speedBoostBaseSpeed = baseSpeed;
      shuttle.normalizeTo(baseSpeed * multiplier);
      this.message(`${CFG.FATAL_BOOSTER_LABEL} ${this.speedBoostLabel()} déclenché par ${this.sideName(side)}.`, 2.4);
      this.explosion(shuttle.x, shuttle.y, this.colors.amber, 18);
      this.audio.play("power");
    }

    deactivateSpeedBoost(shuttle, side) {
      shuttle.normalizeTo(Math.max(CFG.BASE_SPEED, shuttle.speedBoostBaseSpeed || CFG.BASE_SPEED));
      shuttle.clearSpeedBoost();
      if (side) this.message(`${CFG.FATAL_BOOSTER_LABEL} réceptionné par ${this.sideName(side)}. Vitesse normale.`, 1.8);
    }

    clearSpeedBoosterState() {
      this.speedBoosterArmed = { left: false, right: false };
      for (const shuttle of this.shuttles) {
        if (shuttle.speedBoostActive) {
          shuttle.normalizeTo(Math.max(CFG.BASE_SPEED, shuttle.speedBoostBaseSpeed || CFG.BASE_SPEED));
        }
        if (shuttle.clearSpeedBoost) shuttle.clearSpeedBoost();
      }
    }

    armSpeedBooster(side) {
      const paddle = side === "left" ? this.left : this.right;
      const label = this.boostComboLabelForSide(side);
      if (this.speedBoosterArmed[side]) {
        this.message(`${CFG.FATAL_BOOSTER_LABEL} ${this.sideName(side)} déjà armé. Prochain contact raquette.`, 2);
        return;
      }
      if ((paddle.power || 0) < 100) {
        this.message(`${CFG.FATAL_BOOSTER_LABEL} ${this.sideName(side)} pas prêt. Recharge encore avant ${label}.`, 1.8);
        return;
      }
      paddle.power = 0;
      this.speedBoosterArmed[side] = true;
      this.message(`${CFG.FATAL_BOOSTER_LABEL} ${this.sideName(side)} armé. Prochaine frappe : vitesse ${this.speedBoostLabel()}.`, 3);
      this.audio.play("power");
    }

    explosion(x, y, color, count = 14) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 60 + Math.random() * 140;
        this.particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          size: 2 + Math.random() * 4,
          color,
          life: 0.25 + Math.random() * 0.35
        });
      }
    }

    message(text, time = 2.5) {
      this.messageText = text;
      this.messageTime = time;
    }

    countdownLabel() {
      if (this.matchCountdown > 3) return "3";
      if (this.matchCountdown > 2) return "2";
      if (this.matchCountdown > 1) return "1";
      if (this.matchCountdown > 0) return "GO!";
      return "";
    }

    playCountdownCue() {
      const label = this.countdownLabel();
      if (!label || label === this.lastCountdownCue) return;
      this.lastCountdownCue = label;
      this.audio.play(label === "GO!" ? "go" : "countdown");
    }

    handleKeyDown(key) {
      if (key === CFG.SOUND_TOGGLE_KEY) {
        this.audio.toggle();
        return;
      }
      if (key === "f") {
        this.toggleFullscreen();
        return;
      }

      if (this.waitingControl) {
        this.captureControl(key);
        return;
      }

      if (this.handleHomeButtonKey(key)) return;
      if (this.screen === "title") return this.handleTitleKey(key);
      if (this.screen === "how" || this.screen === "credits") return this.handleSimplePanelKey(key);
      if (this.screen === "commands") return this.handleCommandsKey(key);
      if (this.screen === "playerSelect") return this.handlePlayerSelectKey(key);
      if (this.screen === "opponentSelect") return this.handleOpponentSelectKey(key);
      if (this.screen === "setupSelect") return this.handleSetupKey(key);
      if (this.screen === "tournamentOpponents") return this.handleTournamentOpponentsKey(key);
      if (this.screen === "tournamentSetup") return this.handleTournamentSetupKey(key);
      if (this.screen === "tournamentBracket") return this.handleTournamentBracketKey(key);
      if (this.screen === "tournamentVictory") return this.handleTournamentVictoryKey(key);
      if (this.screen === "tournamentIntro") return this.handleTournamentIntroKey(key);
      if (this.screen === "play") return this.handlePlayKey(key);
      if (this.screen === "pause") return this.handlePauseKey(key);
      if (this.screen === "matchEnd") return this.handleMatchEndKey(key);
      if (this.screen === "tournamentEnd") return this.handleTournamentEndKey(key);
    }

    handleTitleKey(key) {
      if (key === "1") return this.startSoloFlow();
      if (key === "2") return this.startDuelFlow();
      if (key === "ArrowUp" || key === "z") return this.moveMenu(-1, this.menuItems.length, "menuIndex");
      if (key === "ArrowDown" || key === "s") return this.moveMenu(1, this.menuItems.length, "menuIndex");
      if (key !== "Enter") return;
      const selected = this.menuItems[this.menuIndex].id;
      this.audio.play("validate");
      if (selected === "solo") this.startSoloFlow();
      if (selected === "duel") this.startDuelFlow();
      if (selected === "tournament") this.startTournamentFlow();
      if (selected === "commands") this.screen = "commands";
      if (selected === "how") this.screen = "how";
      if (selected === "fullscreen") this.toggleFullscreen();
      if (selected === "credits") {
        this.stats = window.FabienStorage.loadStats();
        this.screen = "credits";
      }
    }

    handleSimplePanelKey(key) {
      if (key === "Escape" || key === "Enter") this.startTitle();
    }

    handleCommandsKey(key) {
      const rows = 5;
      if (key === "Escape") return this.startTitle();
      if (key === "ArrowUp" || key === "z") return this.moveMenu(-1, rows, "commandsCursor");
      if (key === "ArrowDown" || key === "s") return this.moveMenu(1, rows, "commandsCursor");
      if (key === "Enter") {
        if (this.commandsCursor === rows - 1) {
          this.controls = window.FabienStorage.resetControls();
          this.message("Commandes réinitialisées. Le clavier respire.", 2);
          this.audio.play("validate");
        } else {
          this.waitingControl = ["p1Up", "p1Down", "p2Up", "p2Down"][this.commandsCursor];
          this.message("Appuie sur une nouvelle touche. Échap annule.", 2);
          this.audio.play("menu");
        }
      }
    }

    captureControl(key) {
      if (key === "Escape") {
        this.waitingControl = null;
        this.message("Modification annulée.", 1.5);
        return;
      }
      this.controls[this.waitingControl] = key;
      window.FabienStorage.saveControls(this.controls);
      this.waitingControl = null;
      this.message("Commande enregistrée. Le clavier accepte son destin.", 2);
      this.audio.play("validate");
    }

    handlePlayerSelectKey(key) {
      const entries = this.playerSelectEntries();
      if (key === "Escape") return this.startTitle();
      if (key === "ArrowLeft" || key === "q") return this.moveGrid(-1, entries.length, "playerCursor");
      if (key === "ArrowRight" || key === "d") return this.moveGrid(1, entries.length, "playerCursor");
      if (key === "ArrowUp" || key === "z") return this.moveGridVertical(-1, entries.length, "playerCursor");
      if (key === "ArrowDown" || key === "s") return this.moveGridVertical(1, entries.length, "playerCursor");
      if (key !== "Enter") return;

      const picked = entries[this.playerCursor] || entries[0];
      this.audio.play("validate");
      if (this.flow === "solo") {
        this.selected.humanId = picked.id;
        this.selected.opponentId = "machine";
        this.beginSetup("solo-setup");
      } else if (this.flow === "duel-p1") {
        this.selected.p1Id = picked.id;
        this.flow = "duel-p2";
        const nextId = this.selected.p2Id === picked.id || this.selected.p2Id === "machine"
          ? this.firstDuelPlayerIdExcept(picked.id)
          : this.selected.p2Id;
        this.playerCursor = this.playerIndexInEntries(nextId, this.playerSelectEntries());
      } else if (this.flow === "duel-p2") {
        if (picked.id === "machine") {
          this.message("La Machine reste au vestiaire en 2 joueurs.", 2);
          return;
        }
        this.selected.p2Id = picked.id;
        this.beginSetup("duel-setup");
      } else if (this.flow === "tournament-player") {
        this.selected.humanId = picked.id;
        this.selected.tournamentOpponents = this.selected.tournamentOpponents.filter(id => id !== picked.id);
        this.tournamentCursor = 0;
        this.screen = "tournamentOpponents";
      }
    }

    handleOpponentSelectKey(key) {
      const total = CFG.PLAYERS.length + 1;
      if (key === "Escape") return this.startSoloFlow();
      if (this.randomRoulette.active) return;
      if (key === "ArrowLeft" || key === "q") return this.moveGrid(-1, total, "opponentCursor");
      if (key === "ArrowRight" || key === "d") return this.moveGrid(1, total, "opponentCursor");
      if (key === "ArrowUp" || key === "z") return this.moveGridVertical(-1, total, "opponentCursor");
      if (key === "ArrowDown" || key === "s") return this.moveGridVertical(1, total, "opponentCursor");
      if (key === "Enter") {
        if (this.opponentCursor >= CFG.PLAYERS.length) return this.startRandomOpponent();
        const picked = CFG.PLAYERS[this.opponentCursor];
        if (picked.id === this.selected.humanId) {
          this.message("Choisis quelqu'un d'autre, sinon Fabien joue contre son reflet.", 2);
          return;
        }
        this.selected.opponentId = picked.id;
        this.audio.play("validate");
        this.beginSetup("solo-setup");
      }
    }

    handleSetupKey(key) {
      const maxRows = 3;
      if (key === "Escape") {
        if (this.flow === "solo-setup") this.startSoloFlow();
        else this.startDuelFlow();
        return;
      }
      if (key === "ArrowUp" || key === "z") return this.moveMenu(-1, maxRows, "setupCursor");
      if (key === "ArrowDown" || key === "s") return this.moveMenu(1, maxRows, "setupCursor");
      if (key === "ArrowLeft" || key === "q") return this.changeSetupValue(-1);
      if (key === "ArrowRight" || key === "d") return this.changeSetupValue(1);
      if (key === "Enter") {
        if (this.flow === "solo-setup") this.startSoloMatch();
        else this.startDuelMatch();
      }
    }

    changeSetupValue(dir) {
      if (this.setupCursor === 0) {
        this.modeCursor = wrap(this.modeCursor + dir, CFG.MATCH_MODES.length);
        this.selected.matchMode = CFG.MATCH_MODES[this.modeCursor].id;
      } else if (this.setupCursor === 1) {
        this.paddleCursor = wrap(this.paddleCursor + dir, CFG.PADDLE_TYPES.length);
        this.selected.p1Paddle = CFG.PADDLE_TYPES[this.paddleCursor].id;
      } else if (this.flow === "solo-setup") {
        this.aiDifficultyCursor = wrap(this.aiDifficultyCursor + dir, CFG.AI_DIFFICULTY_IDS.length);
        this.selected.aiDifficulty = CFG.AI_DIFFICULTY_IDS[this.aiDifficultyCursor];
      } else {
        const idx = this.paddleIndex(this.selected.p2Paddle);
        this.selected.p2Paddle = CFG.PADDLE_TYPES[wrap(idx + dir, CFG.PADDLE_TYPES.length)].id;
      }
      this.audio.play("menu");
    }

    handleTournamentOpponentsKey(key) {
      const players = this.tournamentSelectablePlayers();
      const total = players.length + 2;
      if (key === "Escape") return this.startTournamentFlow();
      if (key === "ArrowLeft" || key === "q") return this.moveGrid(-1, total, "tournamentCursor");
      if (key === "ArrowRight" || key === "d") return this.moveGrid(1, total, "tournamentCursor");
      if (key === "ArrowUp" || key === "z") return this.moveGridVertical(-1, total, "tournamentCursor");
      if (key === "ArrowDown" || key === "s") return this.moveGridVertical(1, total, "tournamentCursor");
      if (key !== "Enter" && key !== " ") return;
      if (this.tournamentCursor === players.length) {
        this.selected.tournamentOpponents = this.randomTournamentOpponents(4);
        this.message("RANDOM ALL : tirage au sort, responsabilité limitée.", 2);
      } else if (this.tournamentCursor === players.length + 1) {
        this.screen = "tournamentSetup";
        this.setupCursor = 0;
      } else {
        const picked = players[this.tournamentCursor];
        if (picked.id === this.selected.humanId) {
          this.message("Le tournoi contre soi-même est une réunion de copropriété.", 2);
          return;
        }
        const list = this.selected.tournamentOpponents;
        const existing = list.indexOf(picked.id);
        if (existing >= 0) list.splice(existing, 1);
        else list.push(picked.id);
      }
      this.audio.play("validate");
    }

    handleTournamentSetupKey(key) {
      if (key === "Escape") {
        this.screen = "tournamentOpponents";
        return;
      }
      if (key === "ArrowUp" || key === "z") return this.moveMenu(-1, 3, "setupCursor");
      if (key === "ArrowDown" || key === "s") return this.moveMenu(1, 3, "setupCursor");
      if (key === "ArrowLeft" || key === "q") return this.changeTournamentSetup(-1);
      if (key === "ArrowRight" || key === "d") return this.changeTournamentSetup(1);
      if (key === "Enter") {
        this.audio.play("validate");
        this.buildTournament();
      }
    }

    changeTournamentSetup(dir) {
      if (this.setupCursor === 0) {
        const idx = this.modeIndex(this.selected.tournamentMode);
        this.selected.tournamentMode = CFG.MATCH_MODES[wrap(idx + dir, CFG.MATCH_MODES.length)].id;
      } else if (this.setupCursor === 1) {
        const idx = this.paddleIndex(this.selected.tournamentPaddle);
        this.selected.tournamentPaddle = CFG.PADDLE_TYPES[wrap(idx + dir, CFG.PADDLE_TYPES.length)].id;
      } else {
        this.message("Les Machines restent en NORMAL. Pas parfaites, juste pénibles.", 1.8);
      }
      this.audio.play("menu");
    }

    handleTournamentIntroKey(key) {
      if (key === "Escape") return this.startTitle();
      if (key === "Enter") return this.startTournamentMatch();
    }

    handleTournamentBracketKey(key) {
      if (!this.tournament) return this.startTitle();
      if (this.tournamentBracketContext === "pause") {
        if (key === "Enter" || key === CFG.PAUSE_KEY) {
          this.screen = "play";
          this.audio.play("validate");
        } else if (key === "Escape") {
          this.screen = "pause";
          this.audio.play("menu");
        }
        return;
      }
      if (key === "Escape") return this.startTitle();
      if (key === "Enter" || key === "r") {
        if (this.tournament.result && this.tournament.result.championId) return this.startTitle();
        return this.startTournamentMatch();
      }
    }

    handleTournamentVictoryKey(key) {
      if (key === "Enter" || key === "Escape" || key === "r") this.startTitle();
    }

    handlePlayKey(key) {
      if (key === CFG.PAUSE_KEY) {
        this.screen = "pause";
        this.audio.play("menu");
      } else if (key === "r") {
        this.restartCurrentMatch();
      } else if (key === "Escape") {
        this.quitMatch();
      } else if (this.tryArmSpeedBoosterCombo("p1", key)) {
        return;
      } else if (this.tryArmSpeedBoosterCombo("p2", key)) {
        return;
      }
    }

    handlePauseKey(key) {
      if (key === CFG.PAUSE_KEY) this.screen = "play";
      if (key === "1") this.cycleRacketForRole("p1");
      if (key === "2") this.cycleRacketForRole("p2");
      if ((key === "Enter" || key === "t") && this.currentMatchConfig && this.currentMatchConfig.tournamentMatch) {
        this.showTournamentBracket("pause");
      }
      if (key === "r") this.restartCurrentMatch();
      if (key === "Escape") this.quitMatch();
    }

    handleMatchEndKey(key) {
      if (key === "Escape") return this.startTitle();
      if (this.currentMatchConfig && this.currentMatchConfig.tournamentMatch) {
        if (key === "Enter" || key === "r") return this.advanceTournament();
      } else {
        if (key === "r" || key === "Enter") return this.restartCurrentMatch();
      }
    }

    handleTournamentEndKey(key) {
      if (key === "Escape") return this.startTitle();
      if (key === "r" || key === "Enter") {
        this.buildTournament();
      }
    }

    moveMenu(delta, length, prop) {
      this[prop] = wrap(this[prop] + delta, length);
      this.audio.play("menu");
    }

    moveGrid(delta, length, prop) {
      this[prop] = wrap(this[prop] + delta, length);
      this.audio.play("menu");
    }

    moveGridVertical(deltaRows, length, prop) {
      const cols = 4;
      const rows = Math.ceil(length / cols);
      const current = this[prop];
      const col = current % cols;
      let row = Math.floor(current / cols);
      for (let attempt = 0; attempt < rows; attempt++) {
        row = wrap(row + deltaRows, rows);
        const next = row * cols + col;
        if (next < length) {
          this[prop] = next;
          break;
        }
      }
      this.audio.play("menu");
    }

    hasControlConflict() {
      const values = [
        this.controls.p1Up,
        this.controls.p1Down,
        this.controls.p2Up,
        this.controls.p2Down
      ];
      return new Set(values).size !== values.length;
    }

    keyLabel(key) {
      const map = {
        ArrowUp: "↑",
        ArrowDown: "↓",
        ArrowLeft: "←",
        ArrowRight: "→",
        " ": "SPACE",
        Enter: "ENTER",
        Escape: "ESC"
      };
      return map[key] || String(key).toUpperCase();
    }

    toggleFullscreen() {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else this.requestFullscreen(false);
    }

    requestFullscreen(silent = false) {
      const root = document.querySelector(".cabinet") || this.canvas;
      if (!document.fullscreenEnabled) {
        if (!silent) {
          this.fullscreenMessageTime = 2;
          this.message("Plein écran indisponible dans ce navigateur.", 2);
        }
        return Promise.resolve(false);
      }
      return root.requestFullscreen()
        .then(() => {
          this.canvas.focus();
          return true;
        })
        .catch(() => {
          if (!silent) {
            this.fullscreenMessageTime = 2;
            this.message("Plein écran refusé. La borne reste en civil.", 2);
          }
          return false;
        });
    }

    requestStartupFullscreen() {
      if (!this.startupFullscreenPending || document.fullscreenElement) return;
      this.requestFullscreen(true).then(success => {
        this.startupFullscreenPending = !success;
      });
    }
  }

  function wrap(value, length) {
    return ((value % length) + length) % length;
  }

  function nextPowerOfTwo(value) {
    let n = 2;
    while (n < value) n *= 2;
    return n;
  }

  function createTournamentBracket(humanParticipants) {
    const humans = humanParticipants.slice();
    const bracketSize = nextPowerOfTwo(Math.max(2, humans.length));
    const machineCount = bracketSize - humans.length;
    const machines = createTournamentMachines(machineCount);
    const participants = seedCompleteBracket(humans, machines.map(player => player.id));
    const playersById = {};

    humans.forEach(id => { playersById[id] = CFG.playerById(id); });
    machines.forEach(player => { playersById[player.id] = player; });

    const rounds = [];
    const roundCount = Math.log2(bracketSize);
    let matchNumber = 1;

    for (let roundIndex = 0; roundIndex < roundCount; roundIndex++) {
      const matchCount = bracketSize / Math.pow(2, roundIndex + 1);
      const label = mainRoundLabel(roundIndex, roundCount);
      const round = [];
      round.label = label;

      for (let matchIndex = 0; matchIndex < matchCount; matchIndex++) {
        if (roundIndex === 0) {
          round.push(createTournamentMatch(matchNumber++, roundIndex, matchIndex, label, {
            playerA: participants[matchIndex * 2],
            playerB: participants[matchIndex * 2 + 1]
          }));
        } else {
          const previousRound = rounds[roundIndex - 1];
          round.push(createTournamentMatch(matchNumber++, roundIndex, matchIndex, label, {
            sourceA: previousRound[matchIndex * 2].id,
            sourceB: previousRound[matchIndex * 2 + 1].id
          }));
        }
      }

      rounds.push(round);
    }

    assignTournamentNextLinks(rounds);
    return { bracketSize, machineCount, participants, playersById, rounds };
  }

  function createTournamentMachines(count) {
    const base = CFG.playerById("machine");
    const machines = [];
    for (let index = 0; index < count; index++) {
      const numbered = count > 1;
      const id = numbered ? `machine-${index + 1}` : "machine";
      machines.push(Object.assign({}, base, {
        id,
        baseId: "machine",
        assetId: "machine",
        name: numbered ? `Machine ${index + 1}` : "Machine",
        difficulty: "normal"
      }));
    }
    return machines;
  }

  function seedCompleteBracket(humans, machines) {
    if (!machines.length) return humans.slice();
    const seeds = [];

    if (machines.length === 1) {
      const lastHumanIndex = humans.length - 1;
      for (let index = 0; index < lastHumanIndex; index += 2) {
        seeds.push(humans[index], humans[index + 1]);
      }
      seeds.push(humans[lastHumanIndex], machines[0]);
      return seeds;
    }

    let humanIndex = 0;
    let machineIndex = 0;
    while (machineIndex < machines.length && humanIndex < humans.length) {
      seeds.push(humans[humanIndex++], machines[machineIndex++]);
    }
    while (humanIndex < humans.length) {
      seeds.push(humans[humanIndex++], humans[humanIndex++]);
    }
    while (machineIndex < machines.length) {
      seeds.push(machines[machineIndex++], machines[machineIndex++]);
    }
    return seeds;
  }

  function createTournamentMatch(number, roundIndex, matchIndex, roundLabelText, slots) {
    return {
      id: `M${number}`,
      roundIndex,
      matchIndex,
      roundLabel: roundLabelText,
      playerA: slots.playerA || null,
      playerB: slots.playerB || null,
      sourceA: slots.sourceA || null,
      sourceB: slots.sourceB || null,
      nextMatchId: null,
      nextSlot: null,
      winner: null,
      status: "upcoming",
      scoreA: null,
      scoreB: null
    };
  }

  function assignTournamentNextLinks(rounds) {
    const byId = {};
    rounds.flat().forEach(match => { byId[match.id] = match; });
    rounds.flat().forEach(match => {
      [["sourceA", "A"], ["sourceB", "B"]].forEach(([sourceKey, slot]) => {
        const source = byId[match[sourceKey]];
        if (!source) return;
        source.nextMatchId = match.id;
        source.nextSlot = slot;
      });
    });
  }

  function mainRoundLabel(index, total) {
    const remaining = total - index;
    if (remaining === 1) return "FINALE";
    if (remaining === 2) return "DEMIS";
    if (remaining === 3) return "QUARTS";
    if (remaining === 4) return "HUITIÈMES";
    return `R${index + 1}`;
  }

  function inside(x, y, bx, by, bw, bh) {
    return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
  }

  function menuIndexAt(x, y, left, top, width, height, gap, total) {
    for (let i = 0; i < total; i++) {
      if (inside(x, y, left, top + i * gap, width, height)) return i;
    }
    return -1;
  }

  function gridIndexAt(x, y, total, startX = 54, startY = 120, cols = 4, tileW = 132, tileH = 70, gapX = 8, gapY = 10) {
    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const xx = startX + col * (tileW + gapX);
      const yy = startY + row * (tileH + gapY);
      if (inside(x, y, xx, yy, tileW, tileH)) return i;
    }
    return -1;
  }

  function optionRowAt(x, y, firstY, gap, total) {
    for (let i = 0; i < total; i++) {
      if (inside(x, y, 190, firstY - 30 + i * gap, 580, 48)) return i;
    }
    return -1;
  }

  window.Game = Game;
})();
