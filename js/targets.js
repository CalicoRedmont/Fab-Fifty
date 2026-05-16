(function () {
  "use strict";

  const PLAYERS = [
    { id: "fabien", name: "Fabien", initials: "FA", files: ["Fabien.jpg", "Fabien-px.png"], difficulty: "normal", line: "La victoire, comme la défaite, sont des opinions discutables." },
    { id: "carole", name: "Carole", initials: "CA", files: ["Carole.jpg", "Carole-px.png"], difficulty: "normal", line: "La fièvre de victoire se soigne." },
    { id: "lucile", name: "Lucile", initials: "LU", files: ["Lucile.jpg", "Lucile-px.png", "Lucile-1.png"], difficulty: "hard", line: "A étudié le bad en bibliothèque." },
    { id: "manu", name: "Manu", initials: "MA", files: ["Manu.jpg", "Manu-px.png", "Manu.png"], difficulty: "normal", line: "Son jeu défie la gravité." },
    { id: "elsie", name: "Elsie", initials: "EL", files: ["Elsie.jpg", "Elsie-px.png"], difficulty: "hard", line: "Style + revers lifté." },
    { id: "stephane", name: "Stéphane", initials: "ST", files: ["Stephane.jpg", "Stephane-px.png", "Stephane.png", "Stéphane-px.png"], difficulty: "hard", line: "Coup droit électrique en mode solo." },
    { id: "cecile", name: "Cécile", initials: "CE", files: ["Cecile.jpg", "Cecile-px.png", "Cécile-px.png"], difficulty: "normal", line: "Toucher en mi mineur." },
    { id: "guillaume", name: "Guillaume", initials: "GU", files: ["Guillaume.jpg", "Guillaume-px.png"], difficulty: "normal", line: "De la cuisse et un jeu fluide." },
    { id: "camille", name: "Camille", initials: "CM", files: ["Camille.jpg", "Camille-px.png"], difficulty: "normal", line: "Le volant suit sa propre voie, et cela se respecte." },
    { id: "olivierr", name: "Olivier R.", initials: "OR", files: ["Olivier.R.jpg", "Olivier-H-px.png", "Olivier.png"], difficulty: "normal", line: "Son service vous dessert" },
    { id: "laureanne", name: "Laure-Anne", initials: "LA", files: ["Laure-Anne.jpg", "Laure-Anne-px.png", "Laure-Anne.png", "LAV-1.png", "LAV-2.png"], difficulty: "hard", line: "Le volant hésite aussi." },
    { id: "olivierd", name: "Olivier D.", initials: "OD", files: ["Olivier.D.jpg", "Olivier-D-px.png"], difficulty: "normal", line: "Forfait le dimanche matin." },
    { id: "emilie", name: "Émilie", initials: "EM", files: ["Emilie.jpg", "Emilie-px.png", "emilie-px.png", "emilie-2.png", "emilie.png"], difficulty: "hard", line: "Déjà au point suivant." },
    { id: "pierre", name: "Pierre", initials: "PI", files: ["Pierre.jpg", "Pierre-px.png", "Pierre-2.png", "Pierre.png"], difficulty: "hard", line: "Ce rebond est une feature." },
    { id: "mathilde", name: "Mathilde", initials: "MT", files: ["Mathilde.jpg", "Mathilde-px.png", "Mathilde.png"], difficulty: "easy", line: "Lecture du jeu aux rayons X" },
    { id: "benjamain", name: "Benjamin", initials: "BJ", files: ["Benjamin.jpg", "Benjamain.jpg", "Benjamin-px.png", "Benjamain-px.png", "Benjamin.png"], difficulty: "normal", line: "Service en profondeur." },
    { id: "machine", name: "Machine", initials: "CPU", files: ["Machine.jpg", "Machine-px.png", "Machine.png"], difficulty: "boss", line: "IA locale. Sourire inquiétant." }
  ];

  const PLAYER_FLAVOR_PROFILES = {
    fabien: { shortProfile: "service subjectif", profile: "service subjectif", quote: "La victoire, comme la défaite, sont des opinions discutables." },
    carole: { shortProfile: "calme suspect", profile: "calme suspect", quote: "La fièvre de victoire se soigne." },
    lucile: { shortProfile: "trajectoire libre", profile: "trajectoire libre", quote: "A étudié le bad en bibliothèque." },
    manu: { shortProfile: "réflexe tardif", profile: "réflexe tardif mais sincère", quote: "Son jeu défie la gravité." },
    elsie: { shortProfile: "pression douce", profile: "pression douce", quote: "Style + revers lifté." },
    stephane: { shortProfile: "angle discutable", profile: "angle discutable", quote: "Coup droit électrique en mode solo." },
    cecile: { shortProfile: "précision floue", profile: "précision floue", quote: "Toucher en mi mineur." },
    guillaume: { shortProfile: "panache dense", profile: "panache dense", quote: "De la cuisse et un jeu fluide." },
    camille: { shortProfile: "tempo souple", profile: "tempo souple", quote: "Le volant suit sa propre voie, et cela se respecte." },
    olivierr: { shortProfile: "revers administratif", profile: "revers administratif", quote: "Son service vous dessert" },
    laureanne: { shortProfile: "élan précis", profile: "élan précis", quote: "Le volant hésite aussi." },
    olivierd: { shortProfile: "attaque polie", profile: "attaque polie", quote: "Forfait le dimanche matin." },
    emilie: { shortProfile: "instinct vertical", profile: "instinct vertical", quote: "Déjà au point suivant." },
    pierre: { shortProfile: "patience armée", profile: "patience armée", quote: "Ce rebond est une feature." },
    mathilde: { shortProfile: "chaos lisible", profile: "chaos lisible", quote: "Lecture du jeu aux rayons X" },
    benjamain: { shortProfile: "focus fragile", profile: "focus fragile", quote: "Service en profondeur." }
  };

  const LOSER_COMMENTS = [
    "{prenom}, la victoire était à portée de main. Puis elle a vu ton score.",
    "{prenom}, tu n’as pas perdu. Tu as juste exploré l’autre fin possible.",
    "{prenom}, ta stratégie restera dans les mémoires. Pas pour les bonnes raisons, mais tout de même.",
    "{prenom}, la partie t’a regardé droit dans les yeux avant de choisir quelqu’un d’autre.",
    "{prenom}, tu as combattu avec courage, précision et un résultat regrettable.",
    "{prenom}, le suspense était intense jusqu’au moment où tu as joué.",
    "{prenom}, ton score raconte une histoire. Une histoire courte, mais sincère.",
    "{prenom}, tu as frôlé la victoire. De très loin, mais l’intention est notée.",
    "{prenom}, le jeu ne t’en veut pas. Il t’a juste classé correctement.",
    "{prenom}, ta défaite a une certaine élégance administrative. C’est rare.",
    "{prenom}, tu as perdu avec une constance presque professionnelle.",
    "{prenom}, la victoire a préféré garder ses distances. On respecte son choix.",
    "{prenom}, ton plan était audacieux. Le résultat, lui, était beaucoup plus traditionnel.",
    "{prenom}, cette partie avait besoin d’un perdant. Tu as répondu présent.",
    "{prenom}, personne ne peut t’enlever ça : tu étais là jusqu’à la fin.",
    "{prenom}, la défaite ne te définit pas. Elle insiste juste beaucoup aujourd’hui.",
    "{prenom}, tu as transformé l’espoir en anecdote. C’est une forme d’art.",
    "{prenom}, ton parcours fut bref, fragile et statistiquement cohérent.",
    "{prenom}, tu as donné une chance aux autres de briller. Beaucoup trop généreux.",
    "{prenom}, la victoire n’était pas contre toi. Elle était simplement ailleurs.",
    "{prenom}, le destin t’a envoyé un brouillon. Tu l’as signé.",
    "{prenom}, le tableau des scores n’a pas négocié.",
    "{prenom}, tu as fait ce qu’on appelle une présence.",
    "{prenom}, ton ambition était là. Le résultat, lui, avait pris congé.",
    "{prenom}, tu étais peut-être à une décision de mieux perdre.",
    "{prenom}, même la chance a demandé un peu de recul.",
    "{prenom}, on cherchait le perdant. Tu as levé la main avec efficacité.",
    "{prenom}, ta performance a suivi une ligne claire : descendante.",
    "{prenom}, tu as perdu sans te disperser. C’est presque une qualité.",
    "{prenom}, le jeu t’a donné le rôle ingrat. Tu l’as joué avec un naturel inquiétant.",
    "{prenom}, tu as visé la gloire et touché le mobilier.",
    "{prenom}, tu as eu une idée. Le jeu avait des règles.",
    "{prenom}, ton score a gardé un silence très parlant.",
    "{prenom}, tu as brillé, mais à contre-jour.",
    "{prenom}, la victoire est passée. Tu étais probablement en pause mentale.",
    "{prenom}, ta défaite a été validée par l’ensemble des témoins.",
    "{prenom}, tu n’as pas échoué. Tu as fourni un exemple pédagogique.",
    "{prenom}, les statistiques avaient préparé ça depuis longtemps.",
    "{prenom}, ton courage mérite mieux que ton résultat.",
    "{prenom}, on ne dira pas que c’était mauvais. On dira que c’était informatif.",
    "{prenom}, la partie t’a confié une mission : ne pas gagner.",
    "{prenom}, ton ego vient de recevoir une notification.",
    "{prenom}, tu as perdu avec une sobriété inquiétante.",
    "{prenom}, le hasard t’a vu arriver et a fermé la porte.",
    "{prenom}, on sentait une stratégie. Elle aussi semblait perdue.",
    "{prenom}, tu as respecté le thème de la défaite jusqu’au bout.",
    "{prenom}, la victoire n’a pas fui. Elle s’est organisée.",
    "{prenom}, ton score est modeste, mais il assume.",
    "{prenom}, tu as fait reculer les attentes. C’est une gestion de crise.",
    "{prenom}, ton talent était probablement sur un autre serveur.",
    "{prenom}, tu as failli surprendre tout le monde. Puis non.",
    "{prenom}, la partie a été rude, surtout pour ton classement.",
    "{prenom}, tu as perdu, mais les archives ont apprécié l’effort.",
    "{prenom}, ton dernier coup restera un mystère utile aux chercheurs.",
    "{prenom}, tu as pris des risques. Le résultat aussi.",
    "{prenom}, tu n’as pas manqué de volonté, seulement de tout le reste.",
    "{prenom}, l’univers t’a envoyé un message. Il était classé dernier.",
    "{prenom}, ton score est bas, mais ton implication est bruyante.",
    "{prenom}, tu as inventé une nouvelle façon d’être juste à côté.",
    "{prenom}, la partie t’a laissé une chance. Tu l’as décorée puis rendue.",
    "{prenom}, tu as été constant dans l’imprévu. Ça ne veut rien dire, mais ça sonne bien.",
    "{prenom}, ton plan B attend encore le plan A.",
    "{prenom}, tu as semé le doute. Principalement sur tes propres choix.",
    "{prenom}, la victoire t’a salué de loin, par politesse.",
    "{prenom}, la défaite t’a reconnu immédiatement.",
    "{prenom}, tu es arrivé en finale de ton propre optimisme.",
    "{prenom}, ton score a le charme discret des petites ambitions.",
    "{prenom}, tu as confondu panache et dégâts collatéraux.",
    "{prenom}, la partie t’a demandé un vainqueur. Tu as proposé autre chose.",
    "{prenom}, tu t’es battu comme si le résultat était facultatif.",
    "{prenom}, ce n’était pas une déroute. C’était une visite guidée.",
    "{prenom}, ton timing était précis, surtout pour rater le bon moment.",
    "{prenom}, tu as perdu dans les règles. Ça sauve un peu les meubles.",
    "{prenom}, la victoire a hésité, puis elle a vu la concurrence.",
    "{prenom}, ton score est un poème court, sans rime et sans espoir.",
    "{prenom}, tu as joué avec ton cœur. Les points demandaient autre chose.",
    "{prenom}, ton classement prouve qu’il y avait plusieurs issues, dont celle-ci.",
    "{prenom}, tu as frôlé l’exploit, si on élargit beaucoup la définition.",
    "{prenom}, la partie ne t’a pas oublié. Elle t’a juste placé en bas.",
    "{prenom}, tu as transformé la pression en décoration.",
    "{prenom}, ton effort mérite une médaille imaginaire.",
    "{prenom}, la victoire t’a contourné avec une efficacité administrative.",
    "{prenom}, tu as montré que perdre aussi demande une méthode.",
    "{prenom}, ton score n’est pas faible. Il est minimaliste.",
    "{prenom}, tu as tenté l’impossible. Il est resté impossible.",
    "{prenom}, tu as donné du relief au tableau des scores.",
    "{prenom}, ton parcours a eu une grande qualité : il est terminé.",
    "{prenom}, tu as laissé la victoire aux autres avec un altruisme suspect.",
    "{prenom}, on a vu passer l’espoir, puis ton tour est arrivé.",
    "{prenom}, ton résultat a demandé le silence par respect.",
    "{prenom}, la partie a tranché, et elle n’a pas tremblé.",
    "{prenom}, tu as joué comme quelqu’un qui voulait enrichir le folklore.",
    "{prenom}, ton score n’a pas gagné, mais il a raconté quelque chose.",
    "{prenom}, la victoire était possible. Voilà pour la partie théorique.",
    "{prenom}, tu as perdu avec une sincérité presque touchante.",
    "{prenom}, ton approche était originale, surtout dans son inefficacité.",
    "{prenom}, tu as offert au jeu une conclusion très lisible.",
    "{prenom}, la chance a consulté ton dossier et s’est abstenue.",
    "{prenom}, tu as rejoint le panthéon discret des fins de classement.",
    "{prenom}, cette partie aura au moins servi à identifier le perdant."
  ];

  const CREDIT_INTRO_TEXTS = [
    "Un programme d’affrontement pixelisé conçu pour régler des différends qui n’existaient pas encore.",
    "Une expérience compétitive de haute absurdité, validée par personne mais assumée par tous.",
    "Le seul jeu capable de transformer une simple présence en rivalité parfaitement inutile.",
    "Un dispositif sportif approximatif pensé pour départager les ego avec une élégance discutable.",
    "Une borne de duel social où le panache compte presque autant que le score.",
    "Une simulation de prestige, de réflexes et de décisions regrettables.",
    "Un concentré de pixels, de tension et de jugement silencieux entre amis.",
    "Un jeu de précision douteuse pour personnes beaucoup trop sûres d’elles.",
    "Une célébration numérique du mauvais timing, du bon chaos et des revers humiliants.",
    "Un monument technologique modeste dédié à la gloire, à la chute, et au volant carré."
  ];
  const CREDIT_CREATION_TEXT = "16 mai 2026 – Anniversaire des 50 ans de Fabien";
  const TITLE_TAGLINE = "En vert et contre tous";
  const PAUSE_TAGLINE = "Le jeu régressif qui te rend vert";
  const MODE_ANNIVERSAIRE_FABIEN = true;
  const ENABLE_WARGAME = true;

  const AI_DIFFICULTIES = {
    easy: { label: "EASY", speed: 190, reaction: 0.44, error: 96, description: "La Machine cligne des pixels." },
    normal: { label: "NORMAL", speed: 260, reaction: 0.32, error: 62, description: "Correcte, mais pas voyante." },
    hard: { label: "HARD", speed: 335, reaction: 0.23, error: 38, description: "Elle commence à lire le volant." },
    boss: { label: "BOSS", speed: 392, reaction: 0.17, error: 24, description: "Très forte, jamais parfaite." }
  };
  const AI_DIFFICULTY_IDS = Object.keys(AI_DIFFICULTIES);

  const MATCH_MODES = [
    { id: "speed", label: "SPEED UP", description: "Le volant accélère à chaque échange." },
    { id: "multi", label: "MULTIBALLS", description: "Un nouveau volant toutes les 30 secondes." },
    { id: "normal", label: "BORING", description: "Un volant, règles classiques." }
  ];

  const PADDLE_TYPES = [
    { id: "round", label: "ROND", description: "Raquette de base, angles souples.", height: 96, width: 24 },
    { id: "triangle", label: "TRIANGLE", description: "Agressif, +4% vitesse.", height: 94, width: 24 },
    { id: "weird", label: "FORME BIZARRE", description: "Imprévisible mais jouable.", height: 96, width: 24 }
  ];

  const SCORE_TO_WIN = 5;
  const BASE_SPEED = 350;
  const PADDLE_BASE_SPEED = 390;
  const PADDLE_SPEED_SHUTTLE_INFLUENCE = 0.38;
  const PADDLE_SPEED_MULTIBALL_BONUS = 0.12;
  const PADDLE_SPEED_MAX_MULTIPLIER = 1.75;
  const PADDLE_SPEED_SHUTTLE_CAP_MULTIPLIER = 2.2;
  const SPEEDUP_PADDLE_HIT = 1.06;
  const SPEEDUP_WALL_HIT = 1.02;
  const SPEEDUP_MAX_MULTIPLIER = 2.2;
  const FATAL_BOOSTER_LABEL = "Fatal Booster";
  const BORING_INITIAL_SPEED_MULTIPLIER = 1.5;
  const SPEED_BOOST_MULTIPLIER = 3.6;
  const BORING_SPEED_BOOST_MULTIPLIER = 4.59;
  const PAUSE_KEY = " ";
  const SOUND_TOGGLE_KEY = "=";
  const MULTIBALL_INTERVAL_SECONDS = 20;
  const MULTIBALL_MAX = 4;
  const SCORE_COOLDOWN_SECONDS = 1;

  function playerById(id) {
    return PLAYERS.find(player => player.id === id) || PLAYERS[0];
  }

  function matchModeById(id) {
    return MATCH_MODES.find(mode => mode.id === id) || MATCH_MODES[0];
  }

  function paddleTypeById(id) {
    return PADDLE_TYPES.find(type => type.id === id) || PADDLE_TYPES[0];
  }

  function aiDifficultyById(id) {
    return AI_DIFFICULTIES[id] || AI_DIFFICULTIES.normal;
  }

  function playerFlavorProfile(player) {
    if (!player) {
      return {
        shortProfile: "profil non homologué",
        profile: "profil non homologué",
        quote: "Les archives refusent de commenter."
      };
    }
    if (player.assetId === "machine" || player.id === "machine" || String(player.id || "").startsWith("machine-")) {
      return {
        shortProfile: "IA normale",
        profile: "IA normale",
        quote: player.line || "IA locale. Sourire inquiétant."
      };
    }
    if (player.id === "random" || player.id === "random-all") {
      return {
        shortProfile: "tirage au sort",
        profile: "tirage au sort",
        quote: player.line || "Le hasard met un survêtement discret."
      };
    }
    if (player.id === "start") {
      return {
        shortProfile: "lancer",
        profile: "lancer le tournoi",
        quote: player.line || "Le tableau attend son destin."
      };
    }
    const flavor = PLAYER_FLAVOR_PROFILES[player.id];
    if (flavor) return flavor;
    return {
      shortProfile: "profil non homologué",
      profile: "profil non homologué",
      quote: player.line || "Les archives refusent de commenter."
    };
  }

  window.BadPongConfig = {
    PLAYERS,
    PLAYER_FLAVOR_PROFILES,
    LOSER_COMMENTS,
    CREDIT_INTRO_TEXTS,
    CREDIT_CREATION_TEXT,
    TITLE_TAGLINE,
    PAUSE_TAGLINE,
    MODE_ANNIVERSAIRE_FABIEN,
    ENABLE_WARGAME,
    AI_DIFFICULTIES,
    AI_DIFFICULTY_IDS,
    MATCH_MODES,
    PADDLE_TYPES,
    SCORE_TO_WIN,
    BASE_SPEED,
    PADDLE_BASE_SPEED,
    PADDLE_SPEED_SHUTTLE_INFLUENCE,
    PADDLE_SPEED_MULTIBALL_BONUS,
    PADDLE_SPEED_MAX_MULTIPLIER,
    PADDLE_SPEED_SHUTTLE_CAP_MULTIPLIER,
    SPEEDUP_PADDLE_HIT,
    SPEEDUP_WALL_HIT,
    SPEEDUP_MAX_MULTIPLIER,
    FATAL_BOOSTER_LABEL,
    BORING_INITIAL_SPEED_MULTIPLIER,
    SPEED_BOOST_MULTIPLIER,
    BORING_SPEED_BOOST_MULTIPLIER,
    PAUSE_KEY,
    SOUND_TOGGLE_KEY,
    MULTIBALL_INTERVAL_SECONDS,
    MULTIBALL_MAX,
    SCORE_COOLDOWN_SECONDS,
    playerById,
    matchModeById,
    paddleTypeById,
    aiDifficultyById,
    playerFlavorProfile
  };
})();
