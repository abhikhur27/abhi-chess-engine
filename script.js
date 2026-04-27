const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const moveListEl = document.getElementById('move-list');
const fenEl = document.getElementById('fen');
const pgnEl = document.getElementById('pgn');
const fenInput = document.getElementById('fen-input');
const positionSummaryEl = document.getElementById('position-summary');
const tacticalPressureEl = document.getElementById('tactical-pressure');
const immediateCapturesBoardEl = document.getElementById('immediate-captures-board');
const evaluationBreakdownEl = document.getElementById('evaluation-breakdown');
const positionPlanEl = document.getElementById('position-plan');
const kingSafetyBoardEl = document.getElementById('king-safety-board');
const openingSummaryEl = document.getElementById('opening-summary');
const moveVerdictEl = document.getElementById('move-verdict');
const engineCandidatesEl = document.getElementById('engine-candidates');
const engineLinePreviewEl = document.getElementById('engine-line-preview');
const messageEl = document.getElementById('message');

const undoBtn = document.getElementById('undo');
const resetBtn = document.getElementById('reset');
const flipBtn = document.getElementById('flip');
const copyFenBtn = document.getElementById('copy-fen');
const copyShareLinkBtn = document.getElementById('copy-share-link');
const copyPgnBtn = document.getElementById('copy-pgn');
const loadFenBtn = document.getElementById('load-fen');

const engineSideSelect = document.getElementById('engine-side');
const engineDepthInput = document.getElementById('engine-depth');
const engineDepthLabel = document.getElementById('engine-depth-label');
const engineMoveBtn = document.getElementById('engine-move');
const engineAutoCheck = document.getElementById('engine-auto');
const engineStatusEl = document.getElementById('engine-status');

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const pieceSymbols = {
  w: { p: '&#9817;', r: '&#9814;', n: '&#9816;', b: '&#9815;', q: '&#9813;', k: '&#9812;' },
  b: { p: '&#9823;', r: '&#9820;', n: '&#9822;', b: '&#9821;', q: '&#9819;', k: '&#9818;' },
};

const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const openingBook = [
  {
    name: 'Ruy Lopez',
    family: 'Open Game',
    cue: 'White develops actively and pins the c6 knight to pressure e5.',
    san: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
  },
  {
    name: 'Italian Game',
    family: 'Open Game',
    cue: 'Fast piece development with pressure on the f7 square.',
    san: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
  },
  {
    name: 'Sicilian Defense',
    family: 'Semi-open Game',
    cue: 'Black fights asymmetrically for central control and queenside counterplay.',
    san: ['e4', 'c5'],
  },
  {
    name: 'French Defense',
    family: 'Semi-open Game',
    cue: 'Black accepts a cramped structure in return for a resilient center.',
    san: ['e4', 'e6'],
  },
  {
    name: 'Caro-Kann Defense',
    family: 'Semi-open Game',
    cue: 'Black builds a durable center with c6 before challenging e4.',
    san: ['e4', 'c6'],
  },
  {
    name: 'Queen\'s Gambit',
    family: 'Closed Game',
    cue: 'White offers the c-pawn to accelerate central influence and development.',
    san: ['d4', 'd5', 'c4'],
  },
  {
    name: 'King\'s Indian Defense',
    family: 'Indian Defense',
    cue: 'Black allows space early and counters with kingside pressure later.',
    san: ['d4', 'Nf6', 'c4', 'g6'],
  },
  {
    name: 'English Opening',
    family: 'Flank Opening',
    cue: 'White controls d5 from the side and keeps the center flexible.',
    san: ['c4'],
  },
];

let game = createGame();
let orientation = 'white';
let selectedSquare = null;
let legalTargets = [];
let lastMove = null;
let lastMoveVerdict = null;
let engineThinking = false;
let pendingEngineTimeout = null;
const START_FEN = createGame().fen();

const pst = {
  p: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  b: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  r: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  q: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  k: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
};

function createGame(fen) {
  try {
    return fen ? new Chess(fen) : new Chess();
  } catch (error) {
    return fen ? Chess(fen) : Chess();
  }
}

function setMessage(text) {
  messageEl.textContent = text;
}

function setEngineStatus(text) {
  engineStatusEl.textContent = text;
}

function isCheckmate() {
  if (typeof game.in_checkmate === 'function') return game.in_checkmate();
  if (typeof game.isCheckmate === 'function') return game.isCheckmate();
  return false;
}

function isDraw() {
  if (typeof game.in_draw === 'function') return game.in_draw();
  if (typeof game.isDraw === 'function') return game.isDraw();
  return false;
}

function isCheck() {
  if (typeof game.in_check === 'function') return game.in_check();
  if (typeof game.isCheck === 'function') return game.isCheck();
  return false;
}

function isGameOver() {
  if (typeof game.game_over === 'function') return game.game_over();
  if (typeof game.isGameOver === 'function') return game.isGameOver();
  return isCheckmate() || isDraw();
}

function orderedRanks() {
  return orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
}

function orderedFiles() {
  return orientation === 'white' ? files : [...files].reverse();
}

function renderBoard() {
  boardEl.innerHTML = '';

  const ranks = orderedRanks();
  const ordered = orderedFiles();

  ranks.forEach((rank, rankIndex) => {
    ordered.forEach((file, fileIndex) => {
      const squareName = `${file}${rank}`;
      const squareColor = (rankIndex + fileIndex) % 2 === 0 ? 'light' : 'dark';

      const square = document.createElement('button');
      square.type = 'button';
      square.className = `square ${squareColor}`;
      square.dataset.square = squareName;

      if (selectedSquare === squareName) square.classList.add('selected');
      if (legalTargets.includes(squareName)) square.classList.add('target');
      if (lastMove && (lastMove.from === squareName || lastMove.to === squareName)) {
        square.classList.add('last-move');
      }

      const piece = game.get(squareName);
      if (piece) {
        const glyph = document.createElement('span');
        glyph.className = `piece-glyph ${piece.color === 'w' ? 'white' : 'black'}`;
        glyph.innerHTML = pieceSymbols[piece.color][piece.type];
        square.appendChild(glyph);
      }

      const isLastRank = rankIndex === ranks.length - 1;
      const isFirstFile = fileIndex === 0;

      if (isLastRank) {
        const fileLabel = document.createElement('span');
        fileLabel.className = 'coordinate file';
        fileLabel.textContent = file;
        square.appendChild(fileLabel);
      }

      if (isFirstFile) {
        const rankLabel = document.createElement('span');
        rankLabel.className = 'coordinate rank';
        rankLabel.textContent = String(rank);
        square.appendChild(rankLabel);
      }

      square.addEventListener('click', () => handleSquareClick(squareName));
      boardEl.appendChild(square);
    });
  });
}

function renderMoveList() {
  const history = game.history();
  moveListEl.innerHTML = '';

  for (let i = 0; i < history.length; i += 2) {
    const whiteMove = history[i] || '';
    const blackMove = history[i + 1] || '';
    const item = document.createElement('li');
    item.textContent = `${whiteMove} ${blackMove}`.trim();
    moveListEl.appendChild(item);
  }
}

function updateStatus() {
  let status;

  if (isCheckmate()) {
    const winner = game.turn() === 'w' ? 'Black' : 'White';
    status = `Checkmate. ${winner} wins.`;
  } else if (isDraw()) {
    status = 'Draw.';
  } else {
    status = `${game.turn() === 'w' ? 'White' : 'Black'} to move`;
    if (isCheck()) {
      status += ' (check)';
    }
  }

  statusEl.textContent = status;
  fenEl.value = game.fen();
  pgnEl.value = game.pgn({ max_width: 72, newline_char: '\n' });
  syncUrlState();

  undoBtn.disabled = game.history().length === 0;
}

function renderAll() {
  renderBoard();
  renderMoveList();
  updateStatus();
  renderPositionSummary();
}

function getLegalTargets(square) {
  try {
    return game.moves({ square, verbose: true }).map((move) => move.to);
  } catch (error) {
    return [];
  }
}

function clearSelection() {
  selectedSquare = null;
  legalTargets = [];
}

function syncUrlState() {
  const params = new URLSearchParams(window.location.search);
  const fen = game.fen();

  if (fen === START_FEN) {
    params.delete('fen');
  } else {
    params.set('fen', fen);
  }

  if (orientation === 'black') {
    params.set('orientation', 'black');
  } else {
    params.delete('orientation');
  }

  const nextUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
  window.history.replaceState({}, '', nextUrl);
}

function hydrateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const fen = params.get('fen');
  const orientationParam = params.get('orientation');

  if (fen) {
    try {
      if (game.load(fen)) {
        setMessage('Loaded shared position from URL.');
      }
    } catch (error) {
      setMessage('Could not load FEN from URL.');
    }
  }

  if (orientationParam === 'black') {
    orientation = 'black';
  }
}

function shouldEngineMoveNow() {
  if (!engineAutoCheck.checked) return false;
  if (isGameOver()) return false;
  return game.turn() === engineSideSelect.value;
}

function pieceSquareValue(piece, row, col) {
  const table = pst[piece.type];
  if (!table) return 0;

  if (piece.color === 'w') {
    return table[row][col];
  }

  return table[7 - row][col];
}

function evaluateBoardDetailed() {
  if (isCheckmate()) {
    return {
      total: game.turn() === 'w' ? -999999 : 999999,
      materialWhite: 0,
      materialBlack: 0,
      positionalWhite: 0,
      positionalBlack: 0,
    };
  }

  if (isDraw()) {
    return {
      total: 0,
      materialWhite: 0,
      materialBlack: 0,
      positionalWhite: 0,
      positionalBlack: 0,
    };
  }

  const board = game.board();
  let materialWhite = 0;
  let materialBlack = 0;
  let positionalWhite = 0;
  let positionalBlack = 0;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;

      const base = pieceValues[piece.type] || 0;
      const positional = pieceSquareValue(piece, row, col);
      if (piece.color === 'w') {
        materialWhite += base;
        positionalWhite += positional;
      } else {
        materialBlack += base;
        positionalBlack += positional;
      }
    }
  }

  return {
    total: materialWhite + positionalWhite - materialBlack - positionalBlack,
    materialWhite,
    materialBlack,
    positionalWhite,
    positionalBlack,
  };
}

function evaluateBoard() {
  return evaluateBoardDetailed().total;
}

function formatEvalLabel(score) {
  if (score === 0) return 'Equal';
  return score > 0 ? `White +${(score / 100).toFixed(1)}` : `Black +${(Math.abs(score) / 100).toFixed(1)}`;
}

function normalizeSan(move) {
  return move.replace(/[+#?!]+/g, '');
}

function identifyOpening() {
  const history = game.history().map(normalizeSan);
  if (!history.length) {
    return {
      name: 'Start position',
      family: 'Unclassified',
      cue: 'No opening moves played yet.',
      matchedPly: 0,
    };
  }

  let bestMatch = null;
  openingBook.forEach((entry) => {
    const matches = entry.san.every((move, index) => history[index] === move);
    if (matches && (!bestMatch || entry.san.length > bestMatch.matchedPly)) {
      bestMatch = { ...entry, matchedPly: entry.san.length };
    }
  });

  if (bestMatch) {
    return bestMatch;
  }

  return {
    name: 'Out of book',
    family: 'Custom line',
    cue: 'The move order no longer matches the small opening guide built into this board.',
    matchedPly: 0,
  };
}

function renderPositionSummary() {
  const board = game.board();
  const totals = { w: 0, b: 0 };
  const counts = { w: 0, b: 0 };

  board.forEach((row) => {
    row.forEach((piece) => {
      if (!piece) return;
      totals[piece.color] += pieceValues[piece.type] || 0;
      counts[piece.color] += 1;
    });
  });

  const evaluation = evaluateBoardDetailed();
  const evalLabel =
    evaluation.total === 0
      ? 'Equal'
      : evaluation.total > 0
        ? `White +${(evaluation.total / 100).toFixed(1)}`
        : `Black +${(Math.abs(evaluation.total) / 100).toFixed(1)}`;

  positionSummaryEl.innerHTML = `
    <p>Material: White ${totals.w} | Black ${totals.b}</p>
    <p>Pieces: White ${counts.w} | Black ${counts.b}</p>
    <p>Static eval: ${evalLabel}</p>
  `;

  if (tacticalPressureEl) {
    const legalMoves = game.moves({ verbose: true });
    const captureCount = legalMoves.filter((move) => move.flags.includes('c') || move.flags.includes('e')).length;
    const checkMoves = legalMoves.reduce((count, move) => {
      game.move(move);
      const san = game.history().slice(-1)[0] || '';
      game.undo();
      return count + (san.includes('+') || san.includes('#') ? 1 : 0);
    }, 0);
    const sideToMove = game.turn() === 'w' ? 'White' : 'Black';
    const phase = counts.w + counts.b <= 10 ? 'Endgame' : counts.w + counts.b <= 20 ? 'Middlegame' : 'Opening';

    tacticalPressureEl.innerHTML = `
      <p>Side to move: ${sideToMove}</p>
      <p>Legal moves: ${legalMoves.length} | Captures: ${captureCount}</p>
      <p>Checking continuations: ${checkMoves} | Phase: ${phase}</p>
    `;

    if (positionPlanEl) {
      const edgeSide = evaluation.total === 0 ? sideToMove : evaluation.total > 0 ? 'White' : 'Black';
      const caution =
        captureCount >= 6
          ? 'The position is tactically sharp, so loose pieces and forcing lines matter more than long plans.'
          : checkMoves >= 2
            ? 'Checking resources are available, so king safety should be verified before making a slow move.'
            : 'The position is comparatively quiet, so coordination and pawn structure are the main levers.';
      const plan =
        phase === 'Opening'
          ? `${edgeSide} should prioritize development and king safety before hunting material.`
          : phase === 'Middlegame'
            ? `${edgeSide} should improve the worst-placed piece and only trade when it preserves the evaluation edge.`
            : `${edgeSide} should simplify into favorable races and activate the king aggressively.`;

      positionPlanEl.innerHTML = `
        <p>Initiative: ${sideToMove} to move with ${formatEvalLabel(evaluation.total)} on the board.</p>
        <p>Plan cue: ${plan}</p>
        <p>Watch-out: ${caution}</p>
      `;
    }

    if (immediateCapturesBoardEl) {
      const captureMoves = legalMoves
        .filter((move) => move.flags.includes('c') || move.flags.includes('e'))
        .map((move) => {
          const target = move.flags.includes('e') ? { type: 'p', color: game.turn() === 'w' ? 'b' : 'w' } : game.get(move.to);
          return {
            san: move.san || `${move.from}-${move.to}`,
            square: move.to,
            value: pieceValues[target?.type] || 100,
            piece: target?.type || '?',
          };
        })
        .sort((a, b) => b.value - a.value);

      if (!captureMoves.length) {
        immediateCapturesBoardEl.innerHTML = '<p>Immediate captures: no direct capture is available for the side to move, so the position is more about setup than tactics.</p>';
      } else {
        const best = captureMoves[0];
        immediateCapturesBoardEl.innerHTML = `
          <p>Immediate captures: ${captureMoves.slice(0, 3).map((move) => `${move.san} on ${move.square}`).join(' | ')}</p>
          <p>Highest-value target: ${best.piece.toUpperCase()} on ${best.square} (${best.value / 100} point piece).</p>
          <p>${captureMoves.length >= 3 ? 'Multiple forcing captures exist, so calculate before committing to a quiet move.' : 'The tactical tree is narrow enough to compare the best capture against one improving move.'}</p>
        `;
      }
    }
  }

  if (evaluationBreakdownEl) {
    const materialEdge = evaluation.materialWhite - evaluation.materialBlack;
    const positionalEdge = evaluation.positionalWhite - evaluation.positionalBlack;
    const tempoSide = game.turn() === 'w' ? 'White' : 'Black';

    evaluationBreakdownEl.innerHTML = `
      <p>Material term: ${materialEdge === 0 ? 'Equal' : materialEdge > 0 ? `White +${(materialEdge / 100).toFixed(1)}` : `Black +${(Math.abs(materialEdge) / 100).toFixed(1)}`}</p>
      <p>Positional term: ${positionalEdge === 0 ? 'Equal' : positionalEdge > 0 ? `White +${(positionalEdge / 100).toFixed(1)}` : `Black +${(Math.abs(positionalEdge) / 100).toFixed(1)}`}</p>
      <p>Side to move: ${tempoSide}</p>
    `;
  }

  if (kingSafetyBoardEl) {
    const kings = { w: null, b: null };
    board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece?.type === 'k') {
          kings[piece.color] = { row: rowIndex, col: colIndex };
        }
      });
    });

    function fileLetter(col) {
      return files[Math.max(0, Math.min(files.length - 1, col))];
    }

    function pawnShield(color, kingSquare) {
      if (!kingSquare) return 0;
      const direction = color === 'w' ? -1 : 1;
      let shield = 0;
      for (let delta = -1; delta <= 1; delta += 1) {
        const row = kingSquare.row + direction;
        const col = kingSquare.col + delta;
        const piece = board[row]?.[col];
        if (piece && piece.color === color && piece.type === 'p') shield += 1;
      }
      return shield;
    }

    function nearbyAttackers(color, kingSquare) {
      if (!kingSquare) return 0;
      const enemy = color === 'w' ? 'b' : 'w';
      let attackers = 0;
      for (let row = Math.max(0, kingSquare.row - 2); row <= Math.min(7, kingSquare.row + 2); row += 1) {
        for (let col = Math.max(0, kingSquare.col - 2); col <= Math.min(7, kingSquare.col + 2); col += 1) {
          const piece = board[row]?.[col];
          if (piece && piece.color === enemy) attackers += 1;
        }
      }
      return attackers;
    }

    const whiteShield = pawnShield('w', kings.w);
    const blackShield = pawnShield('b', kings.b);
    const whitePressure = nearbyAttackers('w', kings.w);
    const blackPressure = nearbyAttackers('b', kings.b);
    const whiteFile = kings.w ? fileLetter(kings.w.col) : '?';
    const blackFile = kings.b ? fileLetter(kings.b.col) : '?';

    kingSafetyBoardEl.innerHTML = `
      <p>White king: ${whiteFile}-file with ${whiteShield}/3 pawn shield and ${whitePressure} nearby attacker${whitePressure === 1 ? '' : 's'}.</p>
      <p>Black king: ${blackFile}-file with ${blackShield}/3 pawn shield and ${blackPressure} nearby attacker${blackPressure === 1 ? '' : 's'}.</p>
      <p>${
        whitePressure === blackPressure && whiteShield === blackShield
          ? 'King safety is roughly balanced right now; the next tactical mistake matters more than static shelter.'
          : whitePressure - whiteShield > blackPressure - blackShield
            ? 'White is carrying the shakier shelter, so forcing trades or checks against the white king deserves attention.'
            : 'Black is carrying the shakier shelter, so the initiative should aim at black king exposure first.'
      }</p>
    `;
  }

  if (openingSummaryEl) {
    const opening = identifyOpening();
    const historyCount = game.history().length;
    openingSummaryEl.innerHTML = `
      <p>Line: ${opening.name}</p>
      <p>Family: ${opening.family}</p>
      <p>${opening.cue}</p>
      <p>Book match depth: ${opening.matchedPly} ply | Moves played: ${historyCount}</p>
    `;
  }

  if (moveVerdictEl) {
    if (!lastMoveVerdict) {
      moveVerdictEl.innerHTML = '<p>Play a move to compare it against the engine candidate list from the prior position.</p>';
    } else {
      moveVerdictEl.innerHTML = `
        <p>Last move: ${lastMoveVerdict.san}</p>
        <p>Verdict: ${lastMoveVerdict.label} | Eval after move: ${formatEvalLabel(lastMoveVerdict.score)}</p>
        <p>${lastMoveVerdict.detail}</p>
      `;
    }
  }

  if (engineCandidatesEl) {
    const ranked = rankEngineMoves(Number(engineDepthInput.value), 3);
    if (!ranked.length) {
      engineCandidatesEl.innerHTML = '<p>No legal continuations to rank from this position.</p>';
    } else {
      const bestScore = ranked[0].score;
      engineCandidatesEl.innerHTML = ranked
        .map((entry, index) => {
          const edge =
            formatEvalLabel(entry.score);
          const margin = Math.abs(entry.score - bestScore);
          const gap = index === 0 ? 'Best line' : `Gap ${Math.round(margin)} cp`;
          return `<p>${index + 1}. ${entry.san} | ${edge} | ${gap}</p>`;
        })
        .join('');
    }
  }

  if (engineLinePreviewEl) {
    const previewLine = buildEngineLinePreview(Number(engineDepthInput.value), 4);
    if (!previewLine.length) {
      engineLinePreviewEl.innerHTML = '<p>No forcing line available from this position.</p>';
    } else {
      engineLinePreviewEl.innerHTML = previewLine
        .map((entry, index) => `<p>${index + 1}. ${entry.side}: ${entry.san} | ${formatEvalLabel(entry.score)}</p>`)
        .join('');
    }
  }
}

function minimax(depth, alpha, beta, maximizingWhite) {
  if (depth === 0 || isGameOver()) {
    return evaluateBoard();
  }

  const moves = game.moves({ verbose: true });

  if (maximizingWhite) {
    let maxEval = -Infinity;

    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(depth - 1, alpha, beta, false);
      game.undo();

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }

    return maxEval;
  }

  let minEval = Infinity;
  for (const move of moves) {
    game.move(move);
    const evaluation = minimax(depth - 1, alpha, beta, true);
    game.undo();

    minEval = Math.min(minEval, evaluation);
    beta = Math.min(beta, evaluation);
    if (beta <= alpha) break;
  }

  return minEval;
}

function rankEngineMoves(depth, limit = 3) {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return [];

  const maximizingWhite = game.turn() === 'w';
  const ranked = [];

  for (const move of moves) {
    game.move(move);
    const score = minimax(depth - 1, -Infinity, Infinity, !maximizingWhite);
    const san = game.history().slice(-1)[0];
    game.undo();
    ranked.push({ move, score, san });
  }

  ranked.sort((a, b) => (maximizingWhite ? b.score - a.score : a.score - b.score));
  return ranked.slice(0, limit);
}

function buildEngineLinePreview(depth, plies = 4) {
  const playedMoves = [];
  const preview = [];

  for (let index = 0; index < plies; index += 1) {
    const ranked = rankEngineMoves(depth, 1);
    if (!ranked.length) break;

    const best = ranked[0];
    preview.push({
      side: game.turn() === 'w' ? 'White' : 'Black',
      san: best.san,
      score: best.score,
    });

    const played = game.move(best.move);
    if (!played) break;
    playedMoves.push(played);

    if (isGameOver()) break;
  }

  while (playedMoves.length) {
    game.undo();
    playedMoves.pop();
  }

  return preview;
}

function bestEngineMove(depth) {
  const ranked = rankEngineMoves(depth, 4);
  if (!ranked.length) return null;

  const bestScore = ranked[0].score;
  const bestMoves = ranked.filter((entry) => entry.score === bestScore);
  const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  return { move: chosen.move, score: chosen.score };
}

function previewMoveVerdict(candidateMove) {
  const depth = Number(engineDepthInput.value);
  const ranked = rankEngineMoves(depth, 5);
  if (!ranked.length) return null;

  const maximizingWhite = game.turn() === 'w';
  const best = ranked[0];
  let selected = ranked.find(
    (entry) =>
      entry.move.from === candidateMove.from &&
      entry.move.to === candidateMove.to &&
      (entry.move.promotion || 'q') === (candidateMove.promotion || 'q')
  );

  if (!selected) {
    const applied = game.move(candidateMove);
    if (!applied) return null;
    const score = minimax(depth - 1, -Infinity, Infinity, !maximizingWhite);
    const san = game.history().slice(-1)[0];
    game.undo();
    selected = { score, san };
  }

  const gap = Math.abs(selected.score - best.score);
  let label = 'Best';
  if (gap > 180) label = 'Mistake';
  else if (gap > 80) label = 'Inaccuracy';
  else if (gap > 30) label = 'Solid';
  else if (gap > 0) label = 'Excellent';

  const detail =
    gap === 0
      ? 'This matched the engine’s top-ranked continuation from the previous position.'
      : `${Math.round(gap)} cp behind the best line. Preferred move: ${best.san}.`;

  return {
    san: selected.san,
    score: selected.score,
    label,
    detail,
  };
}

function scheduleEngineMove() {
  if (engineThinking || !shouldEngineMoveNow()) return;

  engineThinking = true;
  engineMoveBtn.disabled = true;
  setEngineStatus(`Engine thinking at depth ${engineDepthInput.value}...`);

  pendingEngineTimeout = setTimeout(() => {
    const depth = Number(engineDepthInput.value);
    const result = bestEngineMove(depth);

    if (!result) {
      setEngineStatus('No legal engine move available.');
      engineThinking = false;
      engineMoveBtn.disabled = false;
      return;
    }

    lastMoveVerdict = previewMoveVerdict({ from: result.move.from, to: result.move.to, promotion: 'q' });
    const played = game.move({ from: result.move.from, to: result.move.to, promotion: 'q' });
    if (played) {
      lastMove = played;
      clearSelection();
      renderAll();
      setEngineStatus(`Engine played ${played.san} (eval ${result.score}).`);
    }

    engineThinking = false;
    engineMoveBtn.disabled = false;
  }, 35);
}

function handleSquareClick(square) {
  if (engineThinking) return;

  const piece = game.get(square);

  if (selectedSquare) {
    const verdict = previewMoveVerdict({ from: selectedSquare, to: square, promotion: 'q' });
    const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
    if (move) {
      lastMove = move;
      lastMoveVerdict = verdict;
      clearSelection();
      setMessage(`Move played: ${move.san}`);
      renderAll();

      if (shouldEngineMoveNow()) {
        scheduleEngineMove();
      }
      return;
    }
  }

  if (piece && piece.color === game.turn()) {
    if (selectedSquare === square) {
      clearSelection();
    } else {
      selectedSquare = square;
      legalTargets = getLegalTargets(square);
    }
    renderBoard();
    return;
  }

  clearSelection();
  renderBoard();
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    setMessage(`${label} copied to clipboard.`);
  } catch (error) {
    setMessage(`Clipboard copy failed for ${label}.`);
  }
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

undoBtn.addEventListener('click', () => {
  if (pendingEngineTimeout) {
    clearTimeout(pendingEngineTimeout);
    pendingEngineTimeout = null;
  }

  const move = game.undo();
  if (!move) {
    setMessage('No moves to undo.');
    return;
  }

  clearSelection();
  const history = game.history({ verbose: true });
  lastMove = history.length ? history[history.length - 1] : null;
  lastMoveVerdict = null;
  setMessage(`Undid move: ${move.san}`);
  setEngineStatus('Engine state updated after undo.');
  renderAll();
});

resetBtn.addEventListener('click', () => {
  if (pendingEngineTimeout) {
    clearTimeout(pendingEngineTimeout);
    pendingEngineTimeout = null;
  }

  game.reset();
  clearSelection();
  lastMove = null;
  lastMoveVerdict = null;
  engineThinking = false;
  engineMoveBtn.disabled = false;
  setMessage('Game reset to initial position.');
  setEngineStatus('Engine ready.');
  renderAll();

  if (shouldEngineMoveNow()) {
    scheduleEngineMove();
  }
});

flipBtn.addEventListener('click', () => {
  orientation = orientation === 'white' ? 'black' : 'white';
  renderBoard();
  setMessage(`Board flipped to ${orientation} orientation.`);
  syncUrlState();
});

copyFenBtn.addEventListener('click', () => copyText(game.fen(), 'FEN'));
copyShareLinkBtn.addEventListener('click', () => {
  syncUrlState();
  copyText(window.location.href, 'share link');
});
copyPgnBtn.addEventListener('click', () => copyText(game.pgn({ max_width: 72, newline_char: '\n' }), 'PGN'));

loadFenBtn.addEventListener('click', () => {
  const fen = fenInput.value.trim();
  if (!fen) {
    setMessage('Enter a FEN string before loading.');
    return;
  }

  try {
    const loaded = game.load(fen);
    if (!loaded) {
      setMessage('Invalid FEN. Could not load position.');
      return;
    }

    clearSelection();
    const history = game.history({ verbose: true });
    lastMove = history.length ? history[history.length - 1] : null;
    lastMoveVerdict = null;
    setMessage('FEN loaded successfully.');
    setEngineStatus('Position loaded. Engine ready.');
    renderAll();

    if (shouldEngineMoveNow()) {
      scheduleEngineMove();
    }
  } catch (error) {
    setMessage('Invalid FEN. Could not load position.');
  }
});

engineDepthInput.addEventListener('input', () => {
  engineDepthLabel.textContent = engineDepthInput.value;
});

engineMoveBtn.addEventListener('click', () => {
  if (game.turn() !== engineSideSelect.value) {
    setEngineStatus(`It is ${game.turn() === 'w' ? 'White' : 'Black'} to move. Switch engine side or play a move first.`);
    return;
  }

  scheduleEngineMove();
});

engineSideSelect.addEventListener('change', () => {
  setEngineStatus(`Engine side set to ${engineSideSelect.value === 'w' ? 'White' : 'Black'}.`);

  if (shouldEngineMoveNow()) {
    scheduleEngineMove();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) {
    return;
  }

  const key = event.key.toLowerCase();
  if (key === 'u') {
    event.preventDefault();
    undoBtn.click();
  } else if (key === 'r') {
    event.preventDefault();
    resetBtn.click();
  } else if (key === 'f') {
    event.preventDefault();
    flipBtn.click();
  } else if (key === 'e') {
    event.preventDefault();
    engineMoveBtn.click();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    clearSelection();
    renderBoard();
    setMessage('Selection cleared.');
  }
});

hydrateFromUrl();
renderAll();
engineDepthLabel.textContent = engineDepthInput.value;
setMessage('Ready. Select a piece to view legal moves.');
setEngineStatus('Engine ready. Auto reply is on by default.');

if (shouldEngineMoveNow()) {
  scheduleEngineMove();
}
