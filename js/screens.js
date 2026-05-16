(function () {
  "use strict";

  const CFG = window.BadPongConfig;

  function installScreens(Game) {
    Game.prototype.draw = function () {
      if (this.screen === "title") return this.drawTitle();
      if (this.screen === "how") return this.drawHow();
      if (this.screen === "credits") return this.drawCredits();
      if (this.screen === "commands") return this.drawCommands();
      if (this.screen === "playerSelect") return this.drawPlayerSelect();
      if (this.screen === "opponentSelect") return this.drawOpponentSelect();
      if (this.screen === "setupSelect") return this.drawSetupSelect();
      if (this.screen === "tournamentOpponents") return this.drawTournamentOpponents();
      if (this.screen === "tournamentSetup") return this.drawTournamentSetup();
      if (this.screen === "tournamentBracket") return this.drawTournamentBracket();
      if (this.screen === "tournamentVictory") return this.drawTournamentVictory();
      if (this.screen === "tournamentIntro") return this.drawTournamentIntro();
      if (this.screen === "play") return this.drawPlay();
      if (this.screen === "pause") return this.drawPause();
      if (this.screen === "matchEnd") return this.drawMatchEnd();
      if (this.screen === "tournamentEnd") return this.drawTournamentEnd();
      this.drawTitle();
    };

    Game.prototype.drawText = function (str, x, y, size, color = this.colors.green, align = "left") {
      if (!str) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `${size}px "Courier New", Courier, monospace`;
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      ctx.shadowColor = color;
      ctx.shadowBlur = 7;
      ctx.fillStyle = color;
      ctx.fillText(str, x, y);
      ctx.restore();
    };

    Game.prototype.neon = function (str, x, y, size, color = this.colors.green, align = "left") {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `bold ${size}px "Courier New", Courier, monospace`;
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";
      ctx.lineWidth = Math.max(3, size / 9);
      ctx.strokeStyle = "rgba(0,0,0,0.92)";
      ctx.strokeText(str, x, y);
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = color;
      ctx.fillText(str, x, y);
      ctx.fillStyle = "rgba(239,255,242,0.52)";
      ctx.shadowBlur = 2;
      ctx.fillText(str, x + 1, y - 1);
      ctx.restore();
    };

    Game.prototype.panel = function (x, y, w, h, alpha = 0.78) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = this.colors.greenSoft;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    };

    Game.prototype.fillBackground = function () {
      const ctx = this.ctx;
      const g = ctx.createRadialGradient(this.width / 2, this.height / 2, 20, this.width / 2, this.height / 2, this.width * 0.75);
      g.addColorStop(0, "#041509");
      g.addColorStop(1, "#010201");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.width, this.height);
    };

    Game.prototype.drawFrame = function () {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = this.colors.greenSoft;
      ctx.lineWidth = 4;
      ctx.shadowColor = this.colors.green;
      ctx.shadowBlur = 12;
      ctx.strokeRect(18, 18, this.width - 36, this.height - 36);
      ctx.lineWidth = 1;
      ctx.shadowBlur = 4;
      ctx.strokeRect(34, 34, this.width - 68, this.height - 68);
      ctx.restore();
    };

    Game.prototype.drawScanlines = function () {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#000";
      for (let y = 0; y < this.height; y += 4) ctx.fillRect(0, y, this.width, 2);
      ctx.globalAlpha = 0.18 + Math.sin(performance.now() / 120) * 0.03;
      const g = ctx.createRadialGradient(this.width / 2, this.height / 2, 120, this.width / 2, this.height / 2, this.width * 0.7);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
      if (this.drawHomeButton) this.drawHomeButton();
    };

    Game.prototype.drawHomeButton = function () {
      if (!this.shouldShowHomeButton || !this.shouldShowHomeButton()) return;
      const rect = this.homeButtonRect();
      const selected = !!this.homeButtonFocused;
      this.drawArcadeButton(rect.x, rect.y, rect.w, rect.h, "ACCUEIL", selected ? this.colors.amber : this.colors.green);
      if (selected) this.drawText("▶", rect.x - 18, rect.y + 18, 14, this.colors.amber);
    };

    Game.prototype.wrapText = function (str, x, y, maxWidth, lineHeight, color = this.colors.green, align = "left") {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `${Math.max(12, lineHeight - 5)}px "Courier New", Courier, monospace`;
      ctx.textAlign = align;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      const words = String(str).split(" ");
      let line = "";
      let yy = y;
      const xx = align === "center" ? x + maxWidth / 2 : x;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          ctx.fillText(line, xx, yy);
          yy += lineHeight;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, xx, yy);
      ctx.restore();
    };

    Game.prototype.smooth = function (start, end, t) {
      if (t <= start) return 0;
      if (t >= end) return 1;
      const p = (t - start) / (end - start);
      return p * p * (3 - 2 * p);
    };

    Game.prototype.drawPhoto = function (options = {}) {
      const mode = typeof options === "string" ? options : (options.mode || "panel");
      const alpha = typeof options === "number" ? options : (options.alpha ?? 1);
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      this.fillBackground();
      ctx.save();
      ctx.globalAlpha = alpha;
      if (this.photoLoaded) {
        if (mode === "title") {
          const targetH = h * 1.02;
          const targetW = targetH * (this.photo.width / this.photo.height);
          const portraitX = w - targetW - 54;
          const portraitY = 0;
          ctx.drawImage(this.photo, portraitX, portraitY, targetW, targetH);
        } else {
          const coverScale = Math.max(w / this.photo.width, h / this.photo.height);
          const coverW = this.photo.width * coverScale;
          const coverH = this.photo.height * coverScale;
          ctx.drawImage(this.photo, (w - coverW) / 2, (h - coverH) / 2, coverW, coverH);
          ctx.fillStyle = "rgba(0,0,0,0.82)";
          ctx.fillRect(0, 0, w, h);
        }
      } else {
        ctx.fillStyle = "rgba(57,255,104,0.12)";
        ctx.fillRect(560, 64, 300, 408);
        this.drawText("FABIEN SIGNAL", 710, 250, 28, this.colors.green, "center");
        this.drawText("PHOTO DE SECOURS", 710, 286, 16, this.colors.white, "center");
      }

      const sideShade = ctx.createLinearGradient(0, 0, w, 0);
      if (mode === "title") {
        sideShade.addColorStop(0, "rgba(0,0,0,0.85)");
        sideShade.addColorStop(0.45, "rgba(0,0,0,0.58)");
        sideShade.addColorStop(1, "rgba(0,0,0,0.18)");
      } else {
        sideShade.addColorStop(0, "rgba(0,0,0,0.80)");
        sideShade.addColorStop(0.5, "rgba(0,0,0,0.68)");
        sideShade.addColorStop(1, "rgba(0,0,0,0.72)");
      }
      ctx.fillStyle = sideShade;
      ctx.fillRect(0, 0, w, h);

      const bottom = ctx.createLinearGradient(0, 250, 0, h);
      bottom.addColorStop(0, "rgba(0,0,0,0)");
      bottom.addColorStop(1, mode === "title" ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.92)");
      ctx.fillStyle = bottom;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    };

    Game.prototype.drawTitle = function () {
      const t = performance.now() / 1000 - this.titleStartedAt;
      this.drawPhoto({ mode: "title", alpha: Math.min(1, t / 0.8) });
      this.drawFrame();
      this.ctx.save();
      this.ctx.globalAlpha = this.smooth(0.3, 1.2, t);
      this.neon("FAB FIFTY", 54, 90, 64, this.colors.green);
      this.neon("BAD PONG APÉRO SESSION", 56, 136, 27, this.colors.white);
      this.drawText(CFG.TITLE_TAGLINE, 60, 161, 14, this.colors.green);
      this.ctx.restore();
      this.ctx.save();
      this.ctx.globalAlpha = this.smooth(0.9, 1.9, t);
      this.drawText("PRESS ENTER TO LAUNCH THE APÉROGAME", 60, 188, 15, this.colors.amber);
      this.ctx.restore();
      this.ctx.save();
      this.ctx.globalAlpha = this.smooth(1.4, 2.5, t);
      this.drawMainMenu();
      this.ctx.restore();
      if (this.fullscreenMessageTime > 0) this.drawText("FULL SCREEN NON DISPONIBLE", 480, 516, 13, this.colors.amber, "center");
      this.drawScanlines();
    };

    Game.prototype.drawMainMenu = function () {
      const x = 54;
      const y = 242;
      this.panel(42, 204, 372, 286, 0.68);
      this.drawText("MAIN MENU", x + 18, y - 18, 16, this.colors.white);
      this.menuItems.forEach((item, index) => {
        const selected = index === this.menuIndex;
        const yy = y + index * 31;
        if (selected) {
          this.ctx.fillStyle = "rgba(57,255,104,0.14)";
          this.ctx.fillRect(x + 18, yy - 23, 286, 28);
          if (Math.sin(performance.now() / 115) > -0.25) this.drawText("▶", x - 4, yy, 18, this.colors.amber);
        }
        this.neon(item.label, x + 28, yy, selected ? 20 : 17, selected ? this.colors.amber : this.colors.green);
      });
      this.drawText("↑↓ SELECT   ENTER START   1/2 DIRECT", x + 18, 464, 11, this.colors.white);
      this.drawText(`= SOUND ${this.audio.enabled ? "ON" : "OFF"}   F FULL SCREEN`, x + 18, 482, 11, this.colors.green);
    };

    Game.prototype.drawHow = function () {
      this.drawPhoto({ mode: "panel", alpha: 0.52 });
      this.drawFrame();
      this.panel(78, 58, 804, 424, 0.82);
      this.neon("HOW TO PLAY", 480, 105, 34, this.colors.green, "center");
      const lines = [
        "Bad Pong Apéro Session est un Pong version badminton.",
        "Renvoyez le volant avant qu'il ne sorte derrière votre raquette.",
        "Premier à 5 points.",
        "Choisissez joueur, adversaire, raquette et mode de match.",
        "En tournoi : match à élimination directe, joueur Machine si besoin.",
        "",
        "SPEED UP : mode par défaut, le volant accélère à chaque échange.",
        "MULTIBALLS : mode n°2, un nouveau volant toutes les 30 secondes.",
        "BORING : mode n°3, un volant, règles classiques.",
        "",
        "RAQUETTES : Rond souple, Triangle agressif, Forme bizarre imprévisible.",
        "Fatal Booster : appuie haut + bas en même temps.",
        `Contrôles par défaut : J1 ${this.keyLabel(this.controls.p1Up)} / ${this.keyLabel(this.controls.p1Down)}   J2 ${this.keyLabel(this.controls.p2Up)} / ${this.keyLabel(this.controls.p2Down)}`
      ];
      lines.forEach((line, index) => {
        const color = index >= 6 && index <= 8 ? this.colors.amber : this.colors.white;
        this.drawText(line, 120, 140 + index * 22, line ? 14 : 1, color);
      });
      this.drawText("Espace pause   haut+bas Fatal Booster   R replay   = son   F plein écran   Échap menu", 480, 434, 13, this.colors.green, "center");
      this.drawText("Entrée ou Échap : retour", 480, 462, 13, this.colors.amber, "center");
      this.drawScanlines();
    };

    Game.prototype.drawCredits = function () {
      this.drawPhoto({ mode: "panel", alpha: 0.52 });
      this.drawFrame();
      this.panel(92, 54, 776, 438, 0.84);
      this.neon("FAB FIFTY", 480, 96, 36, this.colors.green, "center");
      this.neon("BAD PONG APÉRO SESSION", 480, 130, 22, this.colors.white, "center");
      this.drawText(CFG.TITLE_TAGLINE, 480, 156, 14, this.colors.green, "center");
      this.wrapText(this.creditIntroText, 170, 208, 620, 24, this.colors.white, "center");
      const names = "Fabien, Carole, Lucile, Manu, Elsie, Stéphane, Cécile, Guillaume, Camille, Olivier R., Laure-Anne, Olivier D., Émilie, Pierre, Mathilde, Benjamin, Machine";
      this.wrapText(`Avec : ${names}.`, 150, 292, 660, 24, this.colors.green, "center");
      this.drawText(CFG.CREDIT_CREATION_TEXT, 480, 402, 15, this.colors.white, "center");
      this.drawText("Entrée ou Échap : retour", 480, 468, 13, this.colors.green, "center");
      this.drawScanlines();
    };

    Game.prototype.drawCommands = function () {
      this.drawPhoto({ mode: "panel", alpha: 0.5 });
      this.drawFrame();
      this.panel(140, 64, 680, 416, 0.84);
      this.neon("COMMANDES", 480, 110, 32, this.colors.green, "center");
      const rows = [
        ["Joueur 1 haut", "p1Up"],
        ["Joueur 1 bas", "p1Down"],
        ["Joueur 2 haut", "p2Up"],
        ["Joueur 2 bas", "p2Down"],
        ["RESET DEFAULTS", "reset"]
      ];
      rows.forEach((row, index) => {
        const selected = index === this.commandsCursor;
        const y = 170 + index * 48;
        if (selected) {
          this.ctx.fillStyle = "rgba(57,255,104,0.13)";
          this.ctx.fillRect(218, y - 28, 524, 36);
          this.drawText("▶", 190, y, 18, this.colors.amber);
        }
        this.drawText(row[0], 236, y, 18, selected ? this.colors.amber : this.colors.white);
        if (row[1] !== "reset") this.drawText(this.keyLabel(this.controls[row[1]]), 712, y, 18, this.colors.green, "right");
      });
      if (this.waitingControl) {
        this.drawText("APPUYEZ SUR UNE TOUCHE - ÉCHAP ANNULE", 480, 448, 15, this.colors.amber, "center");
      } else if (this.hasControlConflict()) {
        this.drawText("CONFLIT : deux actions utilisent la même touche.", 480, 448, 14, this.colors.red, "center");
      } else {
        this.drawText("Entrée modifier   Échap menu", 480, 448, 14, this.colors.green, "center");
      }
      this.drawScanlines();
    };

    Game.prototype.drawPlayerSelect = function () {
      this.fillBackground();
      this.drawFrame();
      const title = this.flow === "duel-p2" ? "JOUEUR 2" : this.flow === "duel-p1" ? "JOUEUR 1" : this.flow === "tournament-player" ? "TOURNAMENT PLAYER" : "1 PLAYER";
      this.neon(title, 54, 70, 28, this.colors.green);
      const entries = this.playerSelectEntries();
      const duel = this.flow === "duel-p1" || this.flow === "duel-p2";
      const help = duel
        ? "Choisis un joueur humain. La Machine est réservée au solo."
        : this.flow === "solo"
          ? "Choisis ton joueur. La Machine sera forcément à droite."
          : "Choisis un joueur. Entrée valide. Échap menu.";
      this.drawText(help, 54, 98, 14, this.colors.white);
      this.drawPlayerGrid(entries, this.playerCursor, 54, 120, 4, 132, 70);
      const picked = entries[this.playerCursor] || entries[0];
      this.drawSelectedCard(picked, 620, 122, 278, 330);
      if (this.flow === "solo") this.drawSoloMachineOpponent(620, 456, 278, 66);
      this.drawScanlines();
      this.drawPlayerGridNames(entries, this.playerCursor, 54, 120, 4, 132, 70);
    };

    Game.prototype.drawOpponentSelect = function () {
      this.fillBackground();
      this.drawFrame();
      this.neon("ADVERSAIRE", 54, 70, 28, this.colors.green);
      this.drawText("Choisis un adversaire local. La Machine ne contacte aucune API.", 54, 98, 14, this.colors.white);
      const entries = CFG.PLAYERS.concat([{ id: "random", name: "RANDOM", initials: "?", difficulty: "???", line: "TIRAGE AU SORT", files: [] }]);
      this.drawPlayerGrid(entries, this.opponentCursor, 54, 120, 4, 132, 70, this.selected.humanId);
      const selected = entries[this.opponentCursor];
      if (this.randomRoulette.active) {
        const choices = this.randomOpponentChoices();
        this.drawSelectedCard(choices[this.randomRoulette.cursor] || selected, 620, 122, 278, 330, "ROULETTE");
      } else {
        this.drawSelectedCard(selected, 620, 122, 278, 330);
      }
      this.drawScanlines();
      this.drawPlayerGridNames(entries, this.opponentCursor, 54, 120, 4, 132, 70, this.selected.humanId);
    };

    Game.prototype.drawSetupSelect = function () {
      this.fillBackground();
      this.drawFrame();
      const duel = this.flow === "duel-setup";
      this.neon(duel ? "MATCH 2 PLAYERS" : "MATCH 1 PLAYER", 480, 88, 34, this.colors.green, "center");
      this.panel(145, 128, 670, 292, 0.82);
      const rows = [
        ["MODE", CFG.matchModeById(this.selected.matchMode).label, CFG.matchModeById(this.selected.matchMode).description],
        ["RAQUETTE J1", CFG.paddleTypeById(this.selected.p1Paddle).label, CFG.paddleTypeById(this.selected.p1Paddle).description]
      ];
      if (duel) rows.push(["RAQUETTE J2", CFG.paddleTypeById(this.selected.p2Paddle).label, CFG.paddleTypeById(this.selected.p2Paddle).description]);
      else {
        const ai = CFG.aiDifficultyById(this.selected.aiDifficulty);
        rows.push(["NIVEAU IA", ai.label, ai.description]);
      }
      rows.forEach((row, index) => this.drawOptionRow(row, index, 184 + index * 72, index === this.setupCursor));
      this.drawText("← → changer   ↑ ↓ ligne   Entrée lancer", 480, 384, 14, this.colors.amber, "center");
      this.drawArcadeButton(390, 398, 180, 34, "START", this.colors.green);
      const left = duel ? CFG.playerById(this.selected.p1Id) : CFG.playerById(this.selected.humanId);
      const right = duel ? CFG.playerById(this.selected.p2Id) : CFG.playerById(this.selected.opponentId);
      this.drawText(`${left.name}  VS  ${right.name}`, 480, 456, 18, this.colors.white, "center");
      this.drawScanlines();
    };

    Game.prototype.drawTournamentOpponents = function () {
      this.fillBackground();
      this.drawFrame();
      this.neon("BAD PONG TOURNAMENT", 54, 70, 28, this.colors.green);
      this.drawText("Entrée sélectionne. RANDOM ALL complète la liste. START crée le tableau.", 54, 98, 13, this.colors.white);
      const players = this.tournamentSelectablePlayers ? this.tournamentSelectablePlayers() : CFG.PLAYERS.filter(player => player.id !== "machine");
      const tournamentCount = this.selected.tournamentOpponents.length + 1;
      const entries = players.concat([
        { id: "random-all", name: "RANDOM ALL", initials: "?", difficulty: "AUTO", line: "Tirage automatique", files: [] },
        { id: "start", name: "START", initials: "GO", difficulty: `${tournamentCount} JOUEUR${tournamentCount > 1 ? "S" : ""}`, line: "Lancer la configuration", files: [] }
      ]);
      this.drawPlayerGrid(entries, this.tournamentCursor, 54, 120, 4, 132, 70, this.selected.humanId, this.selected.tournamentOpponents);
      const picked = entries[this.tournamentCursor];
      this.drawSelectedCard(picked, 620, 122, 278, 330);
      this.drawText(`Inscrits : ${[this.selected.humanId].concat(this.selected.tournamentOpponents).map(id => CFG.playerById(id).name).join(", ")}`, 480, 492, 13, this.colors.amber, "center");
      this.drawScanlines();
      this.drawPlayerGridNames(entries, this.tournamentCursor, 54, 120, 4, 132, 70, this.selected.humanId);
    };

    Game.prototype.drawTournamentSetup = function () {
      this.fillBackground();
      this.drawFrame();
      this.neon("TOURNAMENT SETUP", 480, 94, 34, this.colors.green, "center");
      this.panel(150, 128, 660, 292, 0.84);
      const rows = [
        ["MODE TOURNOI", CFG.matchModeById(this.selected.tournamentMode).label, CFG.matchModeById(this.selected.tournamentMode).description],
        ["RAQUETTE", CFG.paddleTypeById(this.selected.tournamentPaddle).label, CFG.paddleTypeById(this.selected.tournamentPaddle).description],
        ["MACHINES", "NORMAL", "Ajoutées en normal pour compléter le tableau."]
      ];
      rows.forEach((row, index) => this.drawOptionRow(row, index, 178 + index * 74, index === this.setupCursor));
      this.drawText("Élimination directe. Le tableau est complété à 2/4/8/16 joueurs.", 480, 432, 14, this.colors.white, "center");
      this.drawText("← → changer   Entrée créer le tableau", 480, 460, 15, this.colors.amber, "center");
      this.drawScanlines();
    };

    Game.prototype.drawTournamentIntro = function () {
      this.fillBackground();
      this.drawFrame();
      const item = this.getCurrentTournamentMatch && this.getCurrentTournamentMatch();
      if (!item) return this.drawTournamentBracket();
      const playerA = this.tournamentSlotValue(item, "A");
      const playerB = this.tournamentSlotValue(item, "B");
      const mode = CFG.matchModeById(this.tournament.modeId);
      this.neon("NEXT MATCH", 480, 94, 34, this.colors.green, "center");
      this.panel(145, 130, 670, 292, 0.84);
      this.drawText(`${item.id}  ROUND ${item.roundIndex + 1}/${this.tournament.rounds.length}`, 480, 174, 20, this.colors.amber, "center");
      this.drawText(`${playerA.label} VS ${playerB.label}`, 480, 218, 28, this.colors.white, "center");
      this.drawText("Joueur gauche : touches J1. Joueur droite : touches J2. Machine : IA.", 480, 260, 15, this.colors.green, "center");
      this.drawText(`Mode : ${mode.label}   Raquette : ${CFG.paddleTypeById(this.tournament.paddleType).label}`, 480, 296, 15, this.colors.white, "center");
      this.drawText("Niveau Machine : NORMAL", 480, 320, 14, this.colors.green, "center");
      this.drawText("Premier à 5 points.", 480, 350, 15, this.colors.amber, "center");
      this.drawText("Entrée : lancer le match   Échap : menu", 480, 386, 15, this.colors.green, "center");
      this.drawScanlines();
    };

    Game.prototype.drawTournamentBracket = function () {
      this.fillBackground();
      this.drawFrame();
      this.neon("FAB FIFTY", 480, 50, 28, this.colors.green, "center");
      this.neon("BAD PONG APÉRO SESSION", 480, 78, 17, this.colors.white, "center");
      this.drawText(CFG.TITLE_TAGLINE, 480, 99, 12, this.colors.green, "center");
      this.neon("TABLEAU DU TOURNOI", 480, 134, 25, this.colors.green, "center");

      if (!this.tournament) {
        this.drawText("Aucun tournoi chargé. Même le tableau refuse le néant.", 480, 270, 16, this.colors.amber, "center");
        this.drawScanlines();
        return;
      }

      this.drawBracketGrid(42, 166, 620, 270);
      this.drawTournamentSidePanel(684, 166, 230, 270);

      const fromPause = this.tournamentBracketContext === "pause";
      if (fromPause) {
        this.drawText("Consultation en pause : le match reste exactement en place.", 480, 462, 12, this.colors.white, "center");
        this.drawArcadeButton(330, 474, 300, 34, "REPRENDRE LA PARTIE", this.colors.amber);
        this.drawText("Entrée/Espace : reprendre   Échap : pause", 480, 524, 12, this.colors.green, "center");
      } else if (this.tournament.result && this.tournament.result.championId) {
        this.drawText(`CHAMPION : ${this.tournament.result.championName}`, 480, 462, 18, this.colors.amber, "center");
        this.drawArcadeButton(320, 474, 320, 34, "RETOUR AU MENU", this.colors.green);
        this.drawText("Entrée ou Échap : menu", 480, 524, 12, this.colors.green, "center");
      } else {
        const next = this.getCurrentTournamentMatch && this.getCurrentTournamentMatch();
        this.drawText(next ? `PROCHAIN MATCH : ${this.tournamentMatchLabel(next)}` : "Calcul du prochain match...", 480, 462, 12, this.colors.white, "center");
        this.drawArcadeButton(320, 474, 320, 34, "LANCER LE PROCHAIN MATCH", this.colors.amber);
        this.drawText("Entrée : lancer   Échap : menu", 480, 524, 12, this.colors.green, "center");
      }
      this.drawScanlines();
    };

    Game.prototype.drawBracketGrid = function (x, y, w, h) {
      const rounds = this.tournament.rounds;
      const colW = w / rounds.length;
      const positions = {};
      rounds.forEach((round, roundIndex) => {
        const boxW = Math.min(142, Math.max(86, colW - 16));
        const slotH = h / round.length;
        const boxH = Math.min(42, Math.max(24, slotH * 0.72));
        const xx = x + roundIndex * colW + Math.max(0, (colW - boxW) / 2);
        this.drawText(round.label || (round[0] && round[0].roundLabel) || roundLabel(roundIndex, rounds.length), xx + boxW / 2, y - 10, 10, this.colors.green, "center");
        round.forEach((match, matchIndex) => {
          const yy = y + matchIndex * slotH + slotH / 2 - boxH / 2;
          positions[match.id] = { x: xx, y: yy, w: boxW, h: boxH, cy: yy + boxH / 2 };
        });
      });

      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = "rgba(57,255,104,0.42)";
      ctx.lineWidth = 1;
      rounds.slice(0, -1).forEach(round => {
        round.forEach(match => {
          const pos = positions[match.id];
          const next = positions[match.nextMatchId];
          if (!pos || !next) return;
          const midX = (pos.x + pos.w + next.x) / 2;
          ctx.beginPath();
          ctx.moveTo(pos.x + pos.w, pos.cy);
          ctx.lineTo(midX, pos.cy);
          ctx.lineTo(midX, next.cy);
          ctx.lineTo(next.x, next.cy);
          ctx.stroke();
        });
      });
      ctx.restore();

      rounds.forEach(round => {
        round.forEach(match => this.drawTournamentMatchBox(match, positions[match.id]));
      });
    };

    Game.prototype.drawTournamentMatchBox = function (match, pos) {
      if (!pos) return;
      const a = this.tournamentSlotValue(match, "A");
      const b = this.tournamentSlotValue(match, "B");
      const current = this.tournament.currentMatchId === match.id && match.status === "current";
      const completed = match.status === "completed";
      const ctx = this.ctx;
      const border = current ? this.colors.amber : completed ? this.colors.green : this.colors.white;
      const font = pos.h < 30 ? 8 : 10;
      ctx.save();
      ctx.fillStyle = current ? "rgba(255,208,79,0.13)" : "rgba(0,0,0,0.86)";
      ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
      ctx.strokeStyle = border;
      ctx.lineWidth = current || completed ? 2 : 1;
      ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);
      this.drawText(match.id, pos.x + 4, pos.y + 10, 8, current ? this.colors.amber : this.colors.green);
      if (completed) this.drawText(`${match.scoreA}-${match.scoreB}`, pos.x + pos.w - 5, pos.y + 10, 8, this.colors.amber, "right");
      const yA = pos.y + pos.h * 0.46;
      const yB = pos.y + pos.h * 0.82;
      this.drawTournamentSlotLine(a, completed && !!a.id && match.winner === a.id, pos.x + 11, yA, pos.w - 18, font);
      this.drawTournamentSlotLine(b, completed && !!b.id && match.winner === b.id, pos.x + 11, yB, pos.w - 18, font);
      if (current && Math.sin(performance.now() / 120) > -0.2) this.drawText("▶", pos.x - 12, pos.y + pos.h / 2 + 4, 12, this.colors.amber);
      ctx.restore();
    };

    Game.prototype.drawTournamentSlotLine = function (slot, winner, x, y, maxChars, size) {
      const color = winner ? this.colors.amber : slot.id ? this.colors.white : this.colors.greenSoft;
      const prefix = winner ? "✓ " : "";
      const text = prefix + compactName(slot.label, Math.max(7, Math.floor(maxChars / 7)));
      this.drawText(text, x, y, size, color);
    };

    Game.prototype.drawTournamentSidePanel = function (x, y, w, h) {
      this.panel(x, y, w, h, 0.78);
      if (this.tournament.result && this.tournament.result.championId) {
        this.drawText("CHAMPION", x + w / 2, y + 34, 15, this.colors.amber, "center");
        this.neon(compactName(this.tournament.result.championName, 15), x + w / 2, y + 82, 22, this.colors.green, "center");
        this.drawText(`${this.tournament.completedTournamentMatches.length} matches joués`, x + w / 2, y + 124, 12, this.colors.white, "center");
        return;
      }

      const current = this.getCurrentTournamentMatch && this.getCurrentTournamentMatch();
      this.drawText(this.tournamentBracketContext === "pause" ? "MATCH EN COURS" : "MATCHES À VENIR", x + w / 2, y + 28, 13, this.colors.amber, "center");
      const upcoming = this.tournament.matches.filter(match => {
        if (match.status !== "current" && match.status !== "upcoming") return false;
        const a = this.tournamentSlotValue(match, "A");
        const b = this.tournamentSlotValue(match, "B");
        return a.label && b.label && a.label !== "À définir" && b.label !== "À définir";
      }).slice(0, 8);
      if (!upcoming.length) {
        this.drawText("Calcul en cours...", x + 16, y + 64, 12, this.colors.white);
        return;
      }
      upcoming.forEach((match, index) => {
        const isCurrent = current && current.id === match.id;
        const yy = y + 62 + index * 24;
        const label = compactName(this.tournamentMatchLabel(match), 28);
        this.drawText(`${isCurrent ? "▶ " : "  "}${label}`, x + 14, yy, 10, isCurrent ? this.colors.amber : this.colors.green);
      });
    };

    Game.prototype.drawTournamentVictory = function () {
      const championId = this.tournamentChampionId || (this.tournament && this.tournament.result && this.tournament.result.championId);
      const champion = this.tournamentPlayerById ? this.tournamentPlayerById(championId) : CFG.playerById(championId);
      const t = performance.now() / 1000 - (this.tournamentVictoryStartedAt || performance.now() / 1000);
      this.fillBackground();
      this.drawVictoryRays(t);
      this.drawVictoryFireworks(t);
      this.drawFrame();

      this.neon("TRIOMPHE HOMOLOGUÉ", 480, 70, 34, this.colors.amber, "center");
      this.neon("CHAMPION DU TOURNOI", 480, 106, 25, this.colors.green, "center");

      this.drawChampionPortrait(champion, 360, 150, 240, 240, t);
      this.drawTrophy(480, 404, 0.86 + Math.sin(t * 4) * 0.02);

      this.neon(champion.name, 480, 444, champion.name.length > 10 ? 30 : 36, this.colors.white, "center");
      this.drawText("EN VERT ET AU SOMMET", 480, 471, 15, this.colors.green, "center");
      this.drawArcadeButton(350, 488, 260, 34, "ENTRÉE : RETOUR", this.colors.amber);
      this.drawText("Échap : menu", 480, 532, 11, this.colors.green, "center");
      this.drawScanlines();
    };

    Game.prototype.drawVictoryRays = function (t) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(480, 292);
      for (let i = 0; i < 20; i++) {
        const a = i * Math.PI * 2 / 20 + t * 0.08;
        ctx.rotate(a);
        ctx.fillStyle = i % 2 ? "rgba(255,208,79,0.035)" : "rgba(57,255,104,0.035)";
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(620, -18);
        ctx.lineTo(620, 18);
        ctx.closePath();
        ctx.fill();
        ctx.rotate(-a);
      }
      ctx.restore();
    };

    Game.prototype.drawVictoryFireworks = function (t) {
      const bursts = [
        [190, 160, 0.00, this.colors.green],
        [755, 155, 0.22, this.colors.amber],
        [215, 322, 0.46, this.colors.white],
        [742, 326, 0.68, this.colors.green],
        [480, 180, 0.84, this.colors.red]
      ];
      const ctx = this.ctx;
      ctx.save();
      bursts.forEach(([x, y, offset, color], burstIndex) => {
        const phase = (t * 0.52 + offset) % 1;
        const radius = 12 + phase * 76;
        const alpha = Math.max(0, 1 - phase);
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        for (let i = 0; i < 18; i++) {
          const angle = i * Math.PI * 2 / 18 + burstIndex * 0.21;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          const size = phase < 0.16 ? 5 : 3;
          ctx.fillRect(px - size / 2, py - size / 2, size, size);
        }
        if (phase < 0.12) {
          ctx.globalAlpha = 0.7;
          ctx.fillRect(x - 8, y - 8, 16, 16);
        }
      });
      ctx.restore();
    };

    Game.prototype.drawChampionPortrait = function (player, x, y, w, h, t) {
      const ctx = this.ctx;
      const asset = this.playerAssets[player.assetId || player.id];
      const pulse = 1 + Math.sin(t * 3.2) * 0.012;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(pulse, pulse);
      ctx.translate(-w / 2, -h / 2);
      ctx.fillStyle = "rgba(0,0,0,0.92)";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = this.colors.amber;
      ctx.lineWidth = 4;
      ctx.shadowColor = this.colors.amber;
      ctx.shadowBlur = 18;
      ctx.strokeRect(0, 0, w, h);
      ctx.strokeStyle = this.colors.green;
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      if (asset && asset.loaded) {
        const img = asset.img;
        const scale = Math.max((w - 22) / img.width, (h - 22) / img.height);
        const iw = img.width * scale;
        const ih = img.height * scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(11, 11, w - 22, h - 22);
        ctx.clip();
        ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(57,255,104,0.10)";
        ctx.fillRect(14, 14, w - 28, h - 28);
        ctx.strokeStyle = this.colors.green;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 - 22, 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeRect(w / 2 - 46, h / 2 + 30, 92, 60);
        this.neon(player.initials || "?", w / 2, h / 2 + 4, 42, this.colors.green, "center");
      }
      ctx.restore();
    };

    Game.prototype.drawTrophy = function (cx, cy, scale) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.shadowColor = this.colors.amber;
      ctx.shadowBlur = 18;
      ctx.fillStyle = this.colors.amber;
      ctx.strokeStyle = "rgba(1,2,1,0.72)";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-48, -58);
      ctx.lineTo(48, -58);
      ctx.lineTo(34, 12);
      ctx.quadraticCurveTo(0, 32, -34, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillRect(-10, 22, 20, 38);
      ctx.fillRect(-42, 60, 84, 18);
      ctx.fillRect(-58, 78, 116, 14);
      ctx.fillStyle = "rgba(1,2,1,0.65)";
      ctx.fillRect(-28, -28, 56, 16);
      this.drawText("FAB", 0, 74, 13, this.colors.black, "center");
      ctx.restore();
    };

    Game.prototype.drawOptionRow = function (row, index, y, selected) {
      if (selected) {
        this.ctx.fillStyle = "rgba(57,255,104,0.14)";
        this.ctx.fillRect(190, y - 30, 580, 48);
        this.drawText("▶", 166, y, 18, this.colors.amber);
      }
      this.drawText(row[0], 210, y, 16, selected ? this.colors.amber : this.colors.white);
      this.neon(row[1], 550, y, 21, selected ? this.colors.amber : this.colors.green, "center");
      this.drawText(row[2], 550, y + 24, 12, this.colors.white, "center");
    };

    Game.prototype.drawPlayerGrid = function (entries, cursor, x, y, cols, tileW, tileH, disabledId, selectedIds = []) {
      entries.forEach((entry, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const xx = x + col * (tileW + 8);
        const yy = y + row * (tileH + 10);
        const selected = index === cursor;
        const disabled = entry.id === disabledId;
        const chosen = selectedIds.includes(entry.id);
        this.drawPlayerTile(entry, xx, yy, tileW, tileH, selected, disabled, chosen);
      });
    };

    Game.prototype.drawPlayerTile = function (player, x, y, w, h, selected, disabled, chosen) {
      if (player.id === "start") return this.drawStartTile(x, y, w, h, selected);
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = disabled ? 0.42 : 1;
      ctx.fillStyle = selected ? "rgba(255,208,79,0.14)" : "rgba(0,0,0,0.72)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = chosen ? this.colors.amber : selected ? this.colors.white : this.colors.greenSoft;
      ctx.lineWidth = selected || chosen ? 3 : 1;
      ctx.strokeRect(x, y, w, h);
      if (chosen) this.drawText("✓", x + w - 15, y + 18, 16, this.colors.amber, "center");
      const portraitSize = Math.min(48, h - 16);
      const textX = x + portraitSize + 14;
      this.drawPortrait(player, x + 8, y + 8, portraitSize, portraitSize, selected);
      this.drawTileName(player.name, textX, y + 38, x + w - textX - 8, selected ? this.colors.amber : "#8bff98");
      ctx.restore();
    };

    Game.prototype.drawPlayerGridNames = function (entries, cursor, x, y, cols, tileW, tileH, disabledId) {
      entries.forEach((entry, index) => {
        if (entry.id === "start") return;
        const col = index % cols;
        const row = Math.floor(index / cols);
        const xx = x + col * (tileW + 8);
        const yy = y + row * (tileH + 10);
        const portraitSize = Math.min(48, tileH - 16);
        const textX = xx + portraitSize + 14;
        const selected = index === cursor;
        const disabled = entry.id === disabledId;
        this.ctx.save();
        this.ctx.globalAlpha = disabled ? 0.42 : 1;
        this.drawTileName(entry.name, textX, yy + 38, xx + tileW - textX - 8, selected ? this.colors.amber : "#baffb5");
        this.ctx.restore();
      });
    };

    Game.prototype.drawTileName = function (name, x, y, maxWidth, color) {
      const ctx = this.ctx;
      let size = 14;
      let lines = [name];
      x = Math.round(x);
      y = Math.round(y);
      maxWidth = Math.floor(maxWidth);
      ctx.save();
      ctx.font = `bold ${size}px "Courier New", Courier, monospace`;
      if (ctx.measureText(name).width > maxWidth) {
        const splitAt = name.includes(" ") ? " " : name.includes("-") ? "-" : "";
        if (splitAt) {
          const pieces = name.split(splitAt).filter(Boolean);
          if (pieces.length === 2) {
            lines = splitAt === "-" ? [`${pieces[0]}-`, pieces[1]] : pieces;
            size = 12;
            ctx.font = `bold ${size}px "Courier New", Courier, monospace`;
          }
        }
      }
      while (Math.max(...lines.map(line => ctx.measureText(line).width)) > maxWidth && size > 9) {
        size -= 1;
        ctx.font = `bold ${size}px "Courier New", Courier, monospace`;
      }
      const lineHeight = Math.ceil(size + 3);
      const firstY = lines.length > 1 ? y - 6 : y;
      ctx.fillStyle = "rgba(0,0,0,0.88)";
      ctx.fillRect(x - 4, firstY - size - 4, maxWidth + 8, lines.length * lineHeight + 7);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      lines.forEach((line, index) => {
        const yy = firstY + index * lineHeight;
        ctx.strokeText(line, x, yy);
        ctx.fillText(line, x, yy);
        ctx.fillText(line, x, yy);
      });
      ctx.restore();
    };

    Game.prototype.drawStartTile = function (x, y, w, h, selected) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = selected ? "rgba(255,208,79,0.14)" : "rgba(0,0,0,0.72)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = selected ? this.colors.white : this.colors.greenSoft;
      ctx.lineWidth = selected ? 3 : 2;
      ctx.strokeRect(x, y, w, h);
      this.neon("START", x + w / 2, y + h / 2 + 7, selected ? 20 : 17, selected ? this.colors.amber : this.colors.green, "center");
      ctx.restore();
    };

    Game.prototype.drawSelectedCard = function (player, x, y, w, h, label) {
      if (player.id === "start") return this.drawStartCard(x, y, w, h);
      const flavor = CFG.playerFlavorProfile ? CFG.playerFlavorProfile(player) : null;
      const quote = flavor ? flavor.quote : (player.line || "Placeholder prêt pour portrait futur.");
      this.panel(x, y, w, h, 0.78);
      this.drawPortrait(player, x + (w - 156) / 2, y + 24, 156, 156, true);
      this.neon(label || player.name, x + w / 2, y + 218, label ? 23 : 26, this.colors.green, "center");
      if (label) this.drawText(player.name, x + w / 2, y + 246, 17, this.colors.amber, "center");
      this.wrapText(quote, x + 34, y + 288, w - 68, 20, this.colors.amber, "center");
    };

    Game.prototype.drawSoloMachineOpponent = function (x, y, w, h) {
      const machine = CFG.playerById("machine");
      if (!machine) return;
      this.panel(x, y, w, h, 0.82);
      this.drawPortrait(machine, x + 10, y + 10, 46, 46, false);
      this.drawText("ADVERSAIRE FIXE", x + 68, y + 20, 11, this.colors.amber);
      this.drawText("Machine", x + 68, y + 42, 17, this.colors.green);
      this.drawText("IA normale à droite", x + w - 12, y + 58, 10, this.colors.white, "right");
    };

    Game.prototype.drawStartCard = function (x, y, w, h) {
      this.panel(x, y, w, h, 0.78);
      this.drawArcadeButton(x + 58, y + 136, w - 116, 58, "START", this.colors.green);
    };

    Game.prototype.drawPortrait = function (player, x, y, w, h, selected) {
      const ctx = this.ctx;
      const asset = this.playerAssets[player.assetId || player.id];
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.88)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = selected ? this.colors.amber : this.colors.greenSoft;
      ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeRect(x, y, w, h);
      if (asset && asset.loaded) {
        const img = asset.img;
        const scale = Math.max(w / img.width, h / img.height);
        const iw = img.width * scale;
        const ih = img.height * scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, w - 4, h - 4);
        ctx.clip();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(57,255,104,0.08)";
        ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
        ctx.strokeStyle = this.colors.greenSoft;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2 - 8, Math.max(10, w * 0.16), 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeRect(x + w * 0.34, y + h * 0.52, w * 0.32, h * 0.25);
        this.drawText(player.initials || "?", x + w / 2, y + h / 2 + 7, Math.max(14, w * 0.18), this.colors.green, "center");
      }
      ctx.restore();
    };

    Game.prototype.drawPlay = function () {
      this.fillBackground();
      this.drawCourt();
      this.drawHud();
      this.drawPaddle(this.left);
      this.drawPaddle(this.right);
      this.drawShuttles();
      this.drawParticles();
      this.drawMessageBar();
      this.drawMatchButtons();
      this.drawCountdown();
      this.drawScanlines();
    };

    Game.prototype.drawCountdown = function () {
      if (!this.matchCountdown || this.matchCountdown <= 0) return;
      const value = this.countdownLabel();
      const pulse = 1 + Math.sin(performance.now() / 80) * 0.05;
      this.ctx.save();
      this.ctx.fillStyle = "rgba(0,0,0,0.48)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.translate(this.width / 2, this.height / 2 + 12);
      this.ctx.scale(pulse, pulse);
      this.neon(value, 0, 0, value === "GO!" ? 72 : 96, value === "GO!" ? this.colors.amber : this.colors.green, "center");
      this.drawText("READY FOR BAD PONG", 0, 46, 15, this.colors.white, "center");
      this.ctx.restore();
    };

    Game.prototype.drawCourt = function () {
      const ctx = this.ctx;
      this.drawFrame();
      ctx.save();
      ctx.fillStyle = "rgba(57,255,104,0.045)";
      ctx.fillRect(this.bounds.left, this.bounds.top, this.bounds.right - this.bounds.left, this.bounds.bottom - this.bounds.top);
      ctx.strokeStyle = "rgba(57,255,104,0.28)";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.bounds.left, this.bounds.top, this.bounds.right - this.bounds.left, this.bounds.bottom - this.bounds.top);
      ctx.strokeStyle = "rgba(57,255,104,0.16)";
      for (let y = this.bounds.top + 18; y < this.bounds.bottom; y += 28) {
        ctx.beginPath();
        ctx.moveTo(this.width / 2, y);
        ctx.lineTo(this.width / 2, y + 13);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(57,255,104,0.08)";
      for (let x = this.bounds.left; x <= this.bounds.right; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, this.bounds.top);
        ctx.lineTo(x, this.bounds.bottom);
        ctx.stroke();
      }
      this.drawFabienMedallion();
      ctx.restore();
    };

    Game.prototype.drawFabienMedallion = function () {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.beginPath();
      ctx.arc(this.width / 2, this.bounds.bottom - 48, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.colors.amber;
      ctx.stroke();
      this.drawText("FAB", this.width / 2, this.bounds.bottom - 52, 16, this.colors.amber, "center");
      this.drawText("50", this.width / 2, this.bounds.bottom - 30, 17, this.colors.green, "center");
      ctx.restore();
    };

    Game.prototype.drawHud = function () {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.92)";
      ctx.fillRect(0, 0, this.width, 78);
      this.drawText(this.leftPlayer.name, 40, 28, 17, this.colors.green);
      this.drawText(this.rightPlayer.name, this.width - 40, 28, 17, this.colors.red, "right");
      this.neon(String(this.left.score), 354, 49, 42, this.colors.green, "center");
      this.neon(String(this.right.score), 606, 49, 42, this.colors.red, "center");
      this.drawText("BAD PONG", 480, 25, 16, this.colors.white, "center");
      this.drawText(`${this.currentMatchMode.label}  ${formatTime(this.elapsed)}`, 480, 55, 12, this.colors.amber, "center");
      this.drawSpeedBoosterMeter(this.left, 40, 50);
      this.drawSpeedBoosterMeter(this.right, this.width - 210, 50);
      ctx.restore();
    };

    Game.prototype.drawSpeedBoosterMeter = function (paddle, x, y) {
      const w = 170;
      const activeShuttle = this.shuttles.find(shuttle => shuttle.speedBoostActive && shuttle.speedBoostOwner === paddle.side);
      const active = !!activeShuttle;
      const armed = this.speedBoosterArmed && this.speedBoosterArmed[paddle.side];
      const p = active || armed ? 1 : Math.max(0, Math.min(1, (paddle.power || 0) / 100));
      const labelKey = this.boostComboLabelForSide(paddle.side);
      this.ctx.fillStyle = "rgba(57,255,104,0.08)";
      this.ctx.fillRect(x, y, w, 9);
      this.ctx.fillStyle = active || armed || p >= 1 ? this.colors.amber : this.colors.greenSoft;
      this.ctx.fillRect(x, y, w * p, 9);
      this.ctx.strokeStyle = this.colors.greenSoft;
      this.ctx.strokeRect(x, y, w, 9);
      const boostLabel = this.speedBoostLabel ? this.speedBoostLabel() : `x${CFG.SPEED_BOOST_MULTIPLIER}`;
      const text = active ? `BOOST ${boostLabel}` : armed ? "BOOST ARMÉ" : `${CFG.FATAL_BOOSTER_LABEL}${p >= 1 && labelKey ? ` PRESS ${labelKey}` : ""}`;
      this.drawText(text, x, y + 23, 9, active || armed || p >= 1 ? this.colors.amber : this.colors.green);
    };

    Game.prototype.drawPaddle = function (paddle) {
      const ctx = this.ctx;
      const side = paddle.side;
      const color = side === "left" ? this.colors.green : this.colors.red;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(0,0,0,0.86)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      if (paddle.typeId === "round") {
        roundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, paddle.w / 2);
        ctx.fill();
        ctx.stroke();
      } else if (paddle.typeId === "triangle") {
        ctx.beginPath();
        if (side === "left") {
          ctx.moveTo(paddle.x, paddle.y);
          ctx.lineTo(paddle.x, paddle.y + paddle.h);
          ctx.lineTo(paddle.x + paddle.w, paddle.y + paddle.h / 2);
        } else {
          ctx.moveTo(paddle.x + paddle.w, paddle.y);
          ctx.lineTo(paddle.x + paddle.w, paddle.y + paddle.h);
          ctx.lineTo(paddle.x, paddle.y + paddle.h / 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (paddle.typeId === "weird") {
        ctx.beginPath();
        ctx.moveTo(paddle.x + 4, paddle.y);
        ctx.lineTo(paddle.x + paddle.w, paddle.y + 12);
        ctx.lineTo(paddle.x + paddle.w - 6, paddle.y + paddle.h * 0.42);
        ctx.lineTo(paddle.x + paddle.w, paddle.y + paddle.h - 10);
        ctx.lineTo(paddle.x + 2, paddle.y + paddle.h);
        ctx.lineTo(paddle.x + 8, paddle.y + paddle.h * 0.58);
        ctx.lineTo(paddle.x, paddle.y + paddle.h * 0.22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
        ctx.strokeRect(paddle.x, paddle.y, paddle.w, paddle.h);
      }
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(paddle.x + 4, paddle.y + 8, Math.max(4, paddle.w - 8), Math.max(8, paddle.h - 16));
      ctx.restore();
    };

    Game.prototype.drawShuttles = function () {
      for (const shuttle of this.shuttles) this.drawShuttle(shuttle);
    };

    Game.prototype.drawShuttle = function (shuttle) {
      const ctx = this.ctx;
      const speed = shuttle.speed || Math.hypot(shuttle.vx || 0, shuttle.vy || 0);
      const speedRatio = Math.min(2.2, speed / CFG.BASE_SPEED);
      const boosted = !!shuttle.speedBoostActive;
      const color = boosted || speedRatio > 1.75 ? this.colors.amber : this.colors.green;
      const s = shuttle.r;
      ctx.save();
      shuttle.trail.forEach((p, index) => {
        ctx.globalAlpha = 0.18 * (1 - index / Math.max(1, shuttle.trail.length));
        ctx.fillStyle = color;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;
      ctx.translate(shuttle.x, shuttle.y);
      ctx.rotate(Math.atan2(shuttle.vy, shuttle.vx));
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (boosted) {
        const flicker = 0.82 + Math.sin(performance.now() / 38) * 0.18;
        ctx.save();
        ctx.shadowColor = this.colors.red;
        ctx.shadowBlur = 18;
        ctx.globalAlpha = flicker;
        ctx.fillStyle = this.colors.red;
        ctx.beginPath();
        ctx.moveTo(-s * 1.28, -s * 0.48);
        ctx.lineTo(-s * 2.5, 0);
        ctx.lineTo(-s * 1.28, s * 0.48);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = this.colors.amber;
        ctx.beginPath();
        ctx.moveTo(-s * 1.12, -s * 0.28);
        ctx.lineTo(-s * 2.02, 0);
        ctx.lineTo(-s * 1.12, s * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = this.colors.white;
        ctx.fillRect(-s * 1.75, -s * 0.1, s * 0.34, s * 0.2);
        ctx.restore();
      }

      ctx.fillStyle = color;
      ctx.strokeStyle = this.colors.white;
      ctx.lineWidth = Math.max(1.3, s * 0.14);

      // Cork head leads the flight; the neon skirt trails behind.
      ctx.beginPath();
      ctx.arc(s * 0.95, 0, s * 0.46, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(s * 0.34, s * 0.46);
      ctx.lineTo(s * 0.34, -s * 0.46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, s * 0.16);
      ctx.beginPath();
      ctx.moveTo(s * 0.34, -s * 0.34);
      ctx.lineTo(-s * 1.05, -s * 0.9);
      ctx.quadraticCurveTo(-s * 1.78, -s * 0.44, -s * 1.52, s * 0.06);
      ctx.quadraticCurveTo(-s * 1.84, s * 0.48, -s * 1.1, s * 0.92);
      ctx.lineTo(s * 0.34, s * 0.34);
      ctx.stroke();

      ctx.lineWidth = Math.max(1, s * 0.12);
      ctx.beginPath();
      ctx.moveTo(s * 0.16, -s * 0.28);
      ctx.lineTo(-s * 1.16, -s * 0.76);
      ctx.moveTo(s * 0.03, 0);
      ctx.lineTo(-s * 1.42, 0);
      ctx.moveTo(s * 0.16, s * 0.28);
      ctx.lineTo(-s * 1.16, s * 0.76);
      ctx.stroke();

      ctx.strokeStyle = this.colors.white;
      ctx.lineWidth = Math.max(1, s * 0.11);
      ctx.beginPath();
      ctx.moveTo(s * 0.34, -s * 0.55);
      ctx.lineTo(s * 0.34, s * 0.55);
      ctx.moveTo(s * 0.55, -s * 0.35);
      ctx.lineTo(s * 1.18, -s * 0.35);
      ctx.moveTo(s * 0.55, s * 0.35);
      ctx.lineTo(s * 1.18, s * 0.35);
      ctx.stroke();

      ctx.fillStyle = "rgba(1,2,1,0.62)";
      ctx.fillRect(s * 0.38, -s * 0.16, s * 0.64, s * 0.32);
      ctx.fillStyle = this.colors.white;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(s * 0.62, -s * 0.28, s * 0.2, s * 0.12);
      ctx.restore();
    };

    Game.prototype.drawParticles = function () {
      const ctx = this.ctx;
      ctx.save();
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, p.life / 0.55);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.restore();
    };

    Game.prototype.drawMessageBar = function () {
      if (this.messageTime <= 0) return;
      this.ctx.save();
      this.ctx.fillStyle = "rgba(0,0,0,0.76)";
      this.ctx.fillRect(70, 510, 610, 24);
      this.drawText(this.messageText, 375, 528, 12, this.colors.amber, "center");
      this.ctx.restore();
    };

    Game.prototype.drawMatchButtons = function () {
      this.drawArcadeButton(694, 511, 64, 22, "ACCUEIL", this.colors.green);
      this.drawArcadeButton(766, 511, 76, 22, "RAQ J1", this.colors.amber);
      if (this.rightControl === "p2") this.drawArcadeButton(850, 511, 76, 22, "RAQ J2", this.colors.amber);
      this.drawText(`ESPACE PAUSE   J1 ${this.boostComboLabelForSide("left")} / J2 ${this.boostComboLabelForSide("right")} Fatal Booster   = SON`, 480, 75, 10, this.colors.green, "center");
    };

    Game.prototype.drawArcadeButton = function (x, y, w, h, label, color) {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(0,0,0,0.78)";
      this.ctx.fillRect(x, y, w, h);
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, w, h);
      this.drawText(label, x + w / 2, y + 15, 10, color, "center");
      this.ctx.restore();
    };

    Game.prototype.drawPause = function () {
      this.drawPlay();
      this.ctx.fillStyle = "rgba(0,0,0,0.74)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.neon("PAUSE", 480, 220, 52, this.colors.green, "center");
      this.drawText(CFG.PAUSE_TAGLINE, 480, 265, 17, this.colors.amber, "center");
      this.drawText("Quelqu'un a voulu parler sérieusement. Reprise recommandée.", 480, 292, 16, this.colors.white, "center");
      this.drawText("Espace : reprendre   1/2 raquettes   R replay   Échap quitter", 480, 336, 15, this.colors.amber, "center");
      const buttons = this.pauseActionButtons ? this.pauseActionButtons() : [];
      buttons.forEach(button => this.drawArcadeButton(button.x, button.y, button.w, button.h, button.label, button.color));
      const hints = [];
      if (this.sideForRole && this.sideForRole("p1")) hints.push("1 : raquette J1");
      if (this.sideForRole && this.sideForRole("p2")) hints.push("2 : raquette J2");
      if (this.currentMatchConfig && this.currentMatchConfig.tournamentMatch) hints.push("Entrée/T : tableau");
      this.drawText(hints.join("   "), 480, 405, 13, this.colors.white, "center");
      this.drawScanlines();
    };

    Game.prototype.drawMatchEnd = function () {
      this.fillBackground();
      this.drawFrame();
      this.neon(this.endTitle, 480, 152, 42, this.endWinnerSide === "left" ? this.colors.green : this.colors.red, "center");
      this.drawText(this.endSub, 480, 202, 22, this.colors.amber, "center");
      this.wrapText(this.endMessage, 190, 238, 580, 24, this.colors.white, "center");
      this.wrapText(this.endLoserComment, 170, 306, 620, 22, this.colors.amber, "center");
      if (this.currentMatchConfig && this.currentMatchConfig.tournamentMatch) {
        this.drawText("Entrée : match suivant   Échap : menu", 480, 404, 16, this.colors.green, "center");
      } else {
        this.drawText("R ou Entrée : replay   Échap : menu principal", 480, 404, 16, this.colors.green, "center");
      }
      this.drawScanlines();
    };

    Game.prototype.drawTournamentEnd = function () {
      const r = this.tournament.result;
      this.fillBackground();
      this.drawFrame();
      this.neon("TOURNAMENT COMPLETE", 480, 102, 34, r.won ? this.colors.green : this.colors.red, "center");
      this.panel(130, 136, 700, 310, 0.82);
      this.drawText(`Adversaires battus : ${r.beaten}   perdus : ${r.lost}`, 480, 190, 20, this.colors.white, "center");
      this.drawText(`Score cumulé : ${r.totalHuman} - ${r.totalOpponents}`, 480, 230, 24, this.colors.amber, "center");
      const best = r.best ? (this.tournamentPlayerById ? this.tournamentPlayerById(r.best.id).name : CFG.playerById(r.best.id).name) : "-";
      const worst = r.worst ? (this.tournamentPlayerById ? this.tournamentPlayerById(r.worst.id).name : CFG.playerById(r.worst.id).name) : "-";
      this.drawText(`Meilleur duel : ${best}`, 480, 280, 16, this.colors.green, "center");
      this.drawText(`Pire duel : ${worst}`, 480, 312, 16, this.colors.red, "center");
      this.drawText("R ou Entrée : replay tournament   Échap : main menu", 480, 396, 15, this.colors.white, "center");
      this.drawScanlines();
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function roundLabel(index, total) {
    const remaining = total - index;
    if (remaining === 1) return "FINALE";
    if (remaining === 2) return "DEMIS";
    if (remaining === 3) return "QUARTS";
    if (remaining === 4) return "HUITIÈMES";
    return `R${index + 1}`;
  }

  function compactName(value, max = 18) {
    const str = String(value || "");
    if (str.length <= max) return str;
    return `${str.slice(0, Math.max(3, max - 1))}…`;
  }

  window.installScreens = installScreens;
})();
