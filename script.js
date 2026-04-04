const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const moveListEl = document.getElementById('move-list');
const fenEl = document.getElementById('fen');
const pgnEl = document.getElementById('pgn');
const fenInput = document.getElementById('fen-input');
const positionSummaryEl = document.getElementById('position-summary');
const evaluationBreakdownEl = document.getElementById('evaluation-breakdown');
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

let game = createGame();
let orientation = 'white';
let selectedSquare = null;
let legalTargets = [];
let lastMove = null;
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

function bestEngineMove(depth) {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;

  const maximizingWhite = game.turn() === 'w';
  let bestScore = maximizingWhite ? -Infinity : Infinity;
  let bestMoves = [];

  for (const move of moves) {
    game.move(move);
    const score = minimax(depth - 1, -Infinity, Infinity, !maximizingWhite);
    game.undo();

    if (maximizingWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    } else if (score < bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  if (!bestMoves.length) return null;
  const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];

  return { move: chosen, score: bestScore };
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
    const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
    if (move) {
      lastMove = move;
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

hydrateFromUrl();
renderAll();
engineDepthLabel.textContent = engineDepthInput.value;
setMessage('Ready. Select a piece to view legal moves.');
setEngineStatus('Engine ready. Auto reply is on by default.');

if (shouldEngineMoveNow()) {
  scheduleEngineMove();
}
