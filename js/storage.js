(function () {
  "use strict";

  const STATS_KEY = "fab_fifty_bad_pong_stats";
  const CONTROLS_KEY = "fab_fifty_bad_pong_controls";

  const DEFAULT_STATS = {
    games: 0,
    winsP1: 0,
    winsP2: 0,
    tournamentWins: 0,
    tournamentLosses: 0,
    bestWinStreak: 0
  };

  const DEFAULT_CONTROLS = {
    p1Up: "z",
    p1Down: "s",
    p2Up: "ArrowUp",
    p2Down: "ArrowDown"
  };

  function loadObject(key, defaults) {
    try {
      return Object.assign({}, defaults, JSON.parse(localStorage.getItem(key) || "{}"));
    } catch (error) {
      return Object.assign({}, defaults);
    }
  }

  function saveObject(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // LocalStorage is optional. Bad Pong must stay playable without it.
    }
  }

  function loadStats() {
    return loadObject(STATS_KEY, DEFAULT_STATS);
  }

  function saveStats(stats) {
    saveObject(STATS_KEY, Object.assign({}, DEFAULT_STATS, stats));
  }

  function recordMatch(winnerSide) {
    const stats = loadStats();
    stats.games += 1;
    if (winnerSide === "left") stats.winsP1 += 1;
    if (winnerSide === "right") stats.winsP2 += 1;
    saveStats(stats);
    return stats;
  }

  function recordTournament(result) {
    const stats = loadStats();
    if (result.won) stats.tournamentWins += 1;
    else stats.tournamentLosses += 1;
    stats.bestWinStreak = Math.max(stats.bestWinStreak, result.beaten || 0);
    saveStats(stats);
    return stats;
  }

  function loadControls() {
    return normalizeControls(loadObject(CONTROLS_KEY, DEFAULT_CONTROLS));
  }

  function saveControls(controls) {
    saveObject(CONTROLS_KEY, normalizeControls(controls));
  }

  function resetControls() {
    saveControls(DEFAULT_CONTROLS);
    return loadControls();
  }

  function normalizeControls(controls) {
    const normalized = {};
    Object.keys(DEFAULT_CONTROLS).forEach(key => {
      normalized[key] = controls && controls[key] ? controls[key] : DEFAULT_CONTROLS[key];
    });
    return normalized;
  }

  window.FabienStorage = {
    DEFAULT_CONTROLS,
    loadStats,
    saveStats,
    recordMatch,
    recordTournament,
    loadControls,
    saveControls,
    resetControls
  };
})();
