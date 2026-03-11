const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const moveListEl = document.getElementById('move-list');
const fenEl = document.getElementById('fen');
const pgnEl = document.getElementById('pgn');
const fenInput = document.getElementById('fen-input');
const messageEl = document.getElementById('message');

const undoBtn = document.getElementById('undo');
const resetBtn = document.getElementById('reset');
const flipBtn = document.getElementById('flip');
const copyFenBtn = document.getElementById('copy-fen');
const copyPgnBtn = document.getElementById('copy-pgn');
const loadFenBtn = document.getElementById('load-fen');

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const pieceSymbols = {
  w: { p: '&#9817;', r: '&#9814;', n: '&#9816;', b: '&#9815;', q: '&#9813;', k: '&#9812;' },
  b: { p: '&#9823;', r: '&#9820;', n: '&#9822;', b: '&#9821;', q: '&#9819;', k: '&#9818;' },
};

let game = createGame();
let orientation = 'white';
let selectedSquare = null;
let legalTargets = [];
let lastMove = null;

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
        glyph.className = 'piece-glyph';
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

  undoBtn.disabled = game.history().length === 0;
}

function renderAll() {
  renderBoard();
  renderMoveList();
  updateStatus();
}

function getLegalTargets(square) {
  try {
    return game
      .moves({ square, verbose: true })
      .map((move) => move.to);
  } catch (error) {
    return [];
  }
}

function handleSquareClick(square) {
  const piece = game.get(square);

  if (selectedSquare) {
    const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
    if (move) {
      lastMove = move;
      selectedSquare = null;
      legalTargets = [];
      setMessage(`Move played: ${move.san}`);
      renderAll();
      return;
    }
  }

  if (piece && piece.color === game.turn()) {
    if (selectedSquare === square) {
      selectedSquare = null;
      legalTargets = [];
    } else {
      selectedSquare = square;
      legalTargets = getLegalTargets(square);
    }
    renderBoard();
    return;
  }

  selectedSquare = null;
  legalTargets = [];
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
  const move = game.undo();
  if (!move) {
    setMessage('No moves to undo.');
    return;
  }

  selectedSquare = null;
  legalTargets = [];
  const history = game.history({ verbose: true });
  lastMove = history.length ? history[history.length - 1] : null;
  setMessage(`Undid move: ${move.san}`);
  renderAll();
});

resetBtn.addEventListener('click', () => {
  game.reset();
  selectedSquare = null;
  legalTargets = [];
  lastMove = null;
  setMessage('Game reset to initial position.');
  renderAll();
});

flipBtn.addEventListener('click', () => {
  orientation = orientation === 'white' ? 'black' : 'white';
  renderBoard();
  setMessage(`Board flipped to ${orientation} orientation.`);
});

copyFenBtn.addEventListener('click', () => copyText(game.fen(), 'FEN'));
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

    selectedSquare = null;
    legalTargets = [];
    const history = game.history({ verbose: true });
    lastMove = history.length ? history[history.length - 1] : null;
    setMessage('FEN loaded successfully.');
    renderAll();
  } catch (error) {
    setMessage('Invalid FEN. Could not load position.');
  }
});

renderAll();
setMessage('Ready. Select a piece to view legal moves.');
