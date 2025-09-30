// Variables globale
let boardState = {};
let board = document.getElementById('board');
let currentFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let turn = currentFen.split(" ")[1];
let draggingPiece = null; // pièce actuellement attrapée

/*******************************************
 * Fonctions d'initialisation de la partie *
 *******************************************/
// Initialisation de boardState (partie logique non visible de la partie)
function initBoardState(fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
    currentFen = fen;
    turn = currentFen.split(" ")[1];
    boardState = {};

    let pos = fen.split(" ")[0];
    let row = 8;
    let col = 1;
    let cell, c, t;
    for (let i = 0; i < pos.length; i++) {
        cell = pos[i];
        if (cell != '/') {
            if ((!isNaN(cell * 1)) && (cell > 0 && cell < 9)) {
                col = col+parseInt(cell);
            } else {
                if ((row > 0 && row < 9) && (col > 0 && col < 9)) {
                    cell == cell.toUpperCase() ? c = 'w' : c = 'b';
                    t = cell.toLowerCase();
                    boardState[`${col}${row}`] = { color:c, type:t, hasMoved:false };
                    col = col+1;
                }
            }
        } else {
            row = row-1;
            col = 1;
        }
    }
}

// Informations textuelles de début de partie (autour du plateau)
function initTextInfo() {
    document.getElementById("turn").innerText = "";
    document.getElementById("check").innerText = "";

    document.getElementById('promotion-popup').style.display = 'none';
    document.getElementById("beforeStart").innerText = "";
    turn == 'w' ? document.getElementById('turn').innerText = 'Trait aux blanc' : document.getElementById('turn').innerText = 'Trait aux noir';
}

// Lancement d'une nouvelle partie (si pas de FEN renseigné, on prend celle par défaut)
function newGame(startingFen) {
    initBoardState(startingFen);
    renderBoard();
    initTextInfo();
    document.getElementById("surrender").style.visibility = 'visible';
    isInCheck(turn) ? setCheckHighlight(true, turn) : setCheckHighlight(false, turn);
}
/***************************************************************************
 ***************************************************************************/


/**************************************
 * Fonctions d'affichage de la partie *
 **************************************/

//Affiche toutes les pièces contenu dans boardState
function renderBoard() {
    board.innerHTML = "";
    for (let square in boardState) {
        let piece = boardState[square];
        if (piece) {
            let col = parseInt(square[0]); // a=1..h=8
            let row = parseInt(square[1]);
            let div = document.createElement("div");
            div.classList.add("cell", "piece", piece.color + piece.type, `square-${col}${row}`);
            div.dataset.square = square;
            div.dataset.color = piece.color;
            div.dataset.type = piece.type;
            board.appendChild(div);
        }
    }
    addPieceListeners();
}

// Ajoute les listeners aux pièces présentent sur le plateaux
function addPieceListeners() {
    document.querySelectorAll('.piece').forEach(piece => {
        piece.addEventListener('mousedown', pieceMouseDown);
        piece.addEventListener('mousemove', onMouseMove);
        piece.addEventListener('mouseup', onMouseUp);
    });
}

//Affiche le popup de promotion du pion
function promotePawn(newClass) {
    // Crée le popup si non existant
    let popup = document.getElementById('promotion-popup');
    let images = document.getElementsByClassName('promo-img');
    if (!popup) {return;}

    popup.style.display = 'flex';

    // Positionne le popup sous le pion
    let rPawn = dgP.getBoundingClientRect();
    let rBoard = board.getBoundingClientRect();
    let rPop = popup.getBoundingClientRect();


    popup.style.left = (rBoard.left + (newClass[0]*(rBoard.width/8)) - (rPop.width/1.5)) + 'px';
    if (newClass[1] == '8') {
        popup.style.top = (rPawn.top + rPawn.height) + 'px';
    } else {
        popup.style.top = (rBoard.height - rPawn.height) + 'px';
    }

    Array.from(images).forEach(img => {
        let pieceType = img.getAttribute('id');
        img.src = `./img/${turn}${pieceType}.png`;
        img.setAttribute('data-piece', newClass);
    });
}
// Execute la promotion du pion
function promoteTo(type, newClass) {
    let p = document.querySelector(`.square-${newClass}.piece.promoting`);
    if (!p) {return;}
    
    p.classList.replace(p.dataset.color+'p', p.dataset.color+type)

    // Reset du popup
    let popup = document.getElementById('promotion-popup');
    popup.style.display = 'none';
    popup.style.left = '';
    popup.style.top = '';

    nextTurn();
}
/***************************************************************************
 ***************************************************************************/


/*****************************************
 * Intéraction du joueur avec les pièces *
 *****************************************/
// Quand le clic est enfoncé
function pieceMouseDown(e) {
    if (e.target.classList.contains('piece') && e.button == 0) { //button == 0 => click gauche
        if (document.getElementById('promotion-popup').style.display == 'none') {
            // Sauvegarde de la pièce sélectionnée
            let pieceDOM = e.target;
            draggingPiece = pieceDOM;
            let pSquare = pieceDOM.dataset.square;
            let piece = getPiece(pSquare);
            if (piece.color != pieceDOM.dataset.color) {
                console.log('différence de donnée');
                return;
            }
            // Amener la pièce devant (pour eviter quelle passe sous une autre)
            pieceDOM.style.zIndex = 10;
            //Mettre le centre de la pièce sur le curseur
            pieceDOM.style.position = "absolute"; //Ne pas mettre "relative"
            pieceDOM.style.top = (e.clientY - (pieceDOM.getBoundingClientRect().width / 2)) + 'px'
            pieceDOM.style.left = (e.clientX - (pieceDOM.getBoundingClientRect().width / 2)) + 'px'
            //Changer le curseur
            pieceDOM.style.cursor = "grabbing";

            // Sélectionner la pièce (visuellement)
            piece.color == turn ? setHighlight(true, pSquare) : setHighlight(false);

            // Vérifier si la pièce peut bouger
            if (piece.color == turn) {
                canThisPieceMove(pSquare, true);
            }
            
            //Supprimer la classe "square-xx" pour cancel la propriété "transform"
            pieceDOM.classList.remove('square-'+pSquare);
        }
    }
};

// Quand le curseur bouge
function onMouseMove(e) {
    if (!draggingPiece) return;
    let pieceDOM = draggingPiece;
    
    if (e.button != 0) return; // Redondant but just to be sure
    // Centrer la pièce sur le curseur
    pieceDOM.style.top = (e.clientY - (pieceDOM.getBoundingClientRect().width / 2)) + 'px';
    pieceDOM.style.left = (e.clientX - (pieceDOM.getBoundingClientRect().width / 2)) + 'px';
}

// Quand le clic est relacher (en fonction de l'endroit sur le plateaux, actions différentes)
function onMouseUp(e) {
    if (!draggingPiece) return;
    let pieceDOM = draggingPiece;
    
    if (e.button != 0) return; // Redondant but just to be sure

    // Récupérer la taille et position du plateau
    const rect = board.getBoundingClientRect();
    const boardSize = rect.width;

    // Position du curseur par rapport au plateau
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // If en-dehors du plateau then highlight else lache la pièce
    if ((x < 0) || (x > boardSize) || (y < 0) || (y > boardSize)) {
        //reset la classe "square-xx"
        pieceDOM.classList.add('square-'+pieceDOM.dataset.square);
    } else {
        // Calculer col and row
        let col = Math.floor((x / boardSize) * 8) + 1; // 1 to 8
        let row = 8 - Math.floor((y / boardSize) * 8); // 8 to 1 (top to bottom)
        let square = pieceDOM.dataset.square;
        // Attacher les valeurs au plateau
        col = Math.max(1, Math.min(8, col));
        row = Math.max(1, Math.min(8, row));

        /**
         * Si la case n'est pas la même => procédure de déplacement de la pièce
         * Si la case est la même => remettre la classe (pour éviter un renderBoard)
         */
        const newSquareClass = `${col}${row}`;
        if (newSquareClass != square) {
            if (document.querySelector(`.hint.square-${newSquareClass}, .capture-hint.square-${newSquareClass}`)) {
                movePiece(square, newSquareClass);
            } else {
                pieceDOM.classList.add(`square-${square}`);
            }
        } else {
            pieceDOM.classList.add(`square-${square}`);
        }
    }

    // Cleanup (sinon la pièce ne revient pas à sa place)
    pieceDOM.style = null;
    pieceDOM = null;
}
/***************************************************************************
 ***************************************************************************/


/***************************************
 * Fonctions de déplacement des pièces *
 ***************************************/
// Récupère la pièce dans boardState
function getPiece(square) {
    return boardState[square] || null;
}

// Modifie la pièce dans le boardState
function setPiece(square, piece) {
    if (piece) {
        boardState[square] = piece;
    } else {
        delete boardState[square];
    }
}

// Déplace une pièce (ou deux en cas de roque)
function movePiece(from, to) {
    let pFrom = getPiece(from);
    if (!pFrom) return false; // Pas de pièce à bouger

    // Si c’est un roque
    // col-2 = +/-2 en fonction de la direction
    if (pFrom.type === 'k' && Math.abs(parseInt(to[0]) - parseInt(from[0])) === 2) {
        let row = from[1];
        if (to[0] == 7) { 
            // Petit roque
            let rook = getPiece(`8${row}`);
            rook.hasMoved = true;
            setPiece(`6${row}`, rook);
            setPiece(`8${row}`, null);
        } else if (to[0] == 3) { 
            // Grand roque
            let rook = getPiece(`1${row}`);
            rook.hasMoved
            setPiece(`4${row}`, rook);
            setPiece(`1${row}`, null);
        }
    }
    pFrom.hasMoved = true;
    // Déplacement
    setPiece(to, pFrom);
    // Suppression de l'ancienne case
    setPiece(from, null);

    // Check s'il y a une promotion à faire
    if (pFrom.type == 'p') {
        if ((pFrom.color == 'b' && to[1] == 1) || (pFrom.color == 'w' && to[1] == 8)) {
            document.getElementsByClassName(`square-${to}`).classList.add('promoting');
            promotePawn(to);
            return;
        } else {
            nextTurn();
        }
    } else {
        nextTurn();
    }
}
/***************************************************************************
 ***************************************************************************/


/************************************
 * Fonctions pour les règles du jeu *
 ************************************/
/**
 * Vérifie si le roi de la couleur en paramètre est en échec
 * Renvoie true si le roi est en échec
 */
function isInCheck(color) {
    // Retrouver la case du roi
    let kingSquare = null;
    for (let square in boardState) {
        let piece = boardState[square];
        if (piece && piece.type === 'k' && piece.color === color) {
            kingSquare = square;
            break;
        }
    }
    if (!kingSquare) return false; // pas de roi trouvé (erreur logique)

    // Parcourir toutes les pièces adverses
    let enemyColor = color === 'w' ? 'b' : 'w';
    for (let square in boardState) {
        let piece = boardState[square];
        if (piece && piece.color === enemyColor) {
            let moves = getPseudoLegalMoves(square, piece.color, piece.type);

            // Vérifier si un coup atteint la case du roi
            if (moves.includes(kingSquare)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Retourne les coups pseudo-légaux (coups légaux sans vérification de la mise en échec).
 * Utilisé pour calculer les menaces sur un roi.
 */
function getPseudoLegalMoves(square, color, type) {
    let col = parseInt(square[0]);
    let row = parseInt(square[1]);
    switch (type) {
        case 'p': return getPawnMoves(col, row, color);
        case 'r': return getRookMoves(col, row, color);
        case 'n': return getKnightMoves(col, row, color);
        case 'b': return getBishopMoves(col, row, color);
        case 'q': return [
            ...getRookMoves(col, row, color),
            ...getBishopMoves(col, row, color)
        ];
        default: return [];
    }
}

// Affiche ou efface le surlignage d'échec (couleur du roi en échec en paramètre)
function setCheckHighlight(onOff, color) {
    document.querySelectorAll('[class*="is-checked"]').forEach(item => item.remove());
    if (onOff) {
        for (let sq in boardState) {
            let p = boardState[sq];
            if (p.color == color && p.type == 'k') {
                let divC = document.createElement('div');
                divC.classList.add('cell', `square-${sq}`, 'is-checked');
                board.appendChild(divC);
                return;
            }
        }
    }
}

// Affiche ou efface le surlignage de sélection d'une pièce (numéro de la case en paramètre)
function setHighlight(onOff, sqNb) {
    document.querySelectorAll('[class*="highlight"]').forEach(item => item.remove());

    if (onOff && sqNb != null) {
        let divH = document.createElement('div');
        divH.classList.add('cell', 'square-'+sqNb);

        // Détermine la couleur de la case pour le style de surbrillance
        let col = parseInt(sqNb[0]);
        let row = parseInt(sqNb[1]);
        (col + row) % 2 === 0 ? divH.classList.add('highlight-dark') : divH.classList.add('highlight-light');
        board.prepend(divH);
    }
}

// Affiche ou efface les cercles noirs qui indiquent où la pièce sélectionnée peut se déplacer
// (les différentes cases possible en paramètres)
function setHintMoves(onOff, moves = []) {
    document.querySelectorAll('[class*="hint"]').forEach(item => item.remove());
    if (onOff && moves != []) {
        let tc; // Target cell
        let div; // Hint div
        moves.forEach(m => {
            tc = getPiece(m);
            // Create the hint square
            div = document.createElement('div');
            div.classList.add('cell');
            !tc ? div.classList.add('hint') : div.classList.add('capture-hint'); //S'il n'y a pas de pièce | s'il y en a une
            div.classList.add(`square-${m}`);

            board.appendChild(div);
            div = null; // remise à 0
        })
    }
}

/**
 * Vérifie si le joueur de la couleur en paramètre peut bouger une pièce (n'importe laquelle)
 * Revoie true dès qu'un coup est trouvé (et arrête la fonction)
 * Renvoie false si aucun coup n'est trouvé.
 */
function canAnyPieceMove(color) {
    let legalMoves = [];
    // Parcours chaque pièce du plateau, vérifie les coups possibles pour chaque pièces
    // S'il y a au moins un coup possible return true
    for (let square in boardState) {
        let p = boardState[square];
        if (p.color == color) {
            legalMoves = getLegalMovesForPiece(square, p.color, p.type);
            if (legalMoves.length > 0) return true;
        }
    }
    return false;
}

/**
 * Vérifie pour une pièce donnée si elle peut bouger (square)
 * Si l'on souhaite afficher les hint pour déplacer la pièce (setHint = true)
 * Sinon renvoie vrai/faux si la pièce peut bouger (setHint = false)
 */
function canThisPieceMove(square, setHint) {
    let p = getPiece(square);
    if (!p) return false;
    
    let legalMoves = [];
    legalMoves = getLegalMovesForPiece(square, p.color, p.type);
    if (setHint) {
        setHintMoves(true, legalMoves);
    } else {
        return legalMoves.length > 0;
    }
}

/**
 * Génère tous les coups légaux pour une pièce donnée (ne laisse pas le roi en échec).
 * Renvoie la liste des cases cibles légales (ex: ["53", "54"])
 */
function getLegalMovesForPiece(square, color, type) {
    let col = parseInt(square[0]);
    let row = parseInt(square[1]);
    let candidateMoves = [];
    
    switch (type) {
        case 'p':
            candidateMoves = getPawnMoves(col, row, color);
            break;
        case 'r':
            candidateMoves = getRookMoves(col, row, color);
            break;
        case 'n':
            candidateMoves = getKnightMoves(col, row, color);
            break;
        case 'b':
            candidateMoves = getBishopMoves(col, row, color);
            break;
        case 'q':
            candidateMoves = [
                ...getRookMoves(col, row, color),
                ...getBishopMoves(col, row, color)
            ];
            break;
        case 'k':
            candidateMoves = getKingMoves(col, row, color);
            break;
        default:
            break;
    }
    // Filtre les coups qui laissent le roi en échec
    return candidateMoves.filter(targetClass => isLegalMove(square, targetClass));
}

/**
 * Récupère la liste des coups possible pour un pion donné
 */
function getPawnMoves(col, row, color) {
    let moves = [];
    let dir = color === 'w' ? 1 : -1;
    let startRow = color === 'w' ? 2 : 7;
    let p;

    // Avance d'une case
    let fwdRow = row + dir;
    if (fwdRow > 0 && fwdRow < 9) {
        p = getPiece(`${col}${fwdRow}`)
        if (!p) {
            moves.push(`${col}${fwdRow}`);
            // Avance de deux cases depuis la position initiale
            if (row === startRow) {
                let fwd2Row = row + 2 * dir;
                p = getPiece(`${col}${fwd2Row}`)
                if (!p) {
                    moves.push(`${col}${fwd2Row}`);
                }
            }
        }
    }
    // Prises diagonales
    for (let dc of [-1, 1]) {
        let c = col + dc;
        let r = row + dir;
        if (c > 0 && c < 9 && r > 0 && r < 9) {
            p = getPiece(`${c}${r}`);
            if (p != null && p.color !== color) {
                moves.push(`${c}${r}`);
            }
        }
    }
    // TODO: gérer "en passant"
    return moves;
}

/**
 * Récupère la liste des coups possible pour une tour (ou dame) donné
 */
function getRookMoves(col, row, color) {
    let moves = [];
    // Directions: gauche, droite, haut, bas
    for (let d of [
        [-1, 0], [1, 0], [0, 1], [0, -1]
    ]) {
        let [dx, dy] = d;
        let x = col, y = row;
        while (true) {
            x += dx; y += dy;
            if (x < 1 || x > 8 || y < 1 || y > 8) break;
            let target = getPiece(`${x}${y}`);
            if (!target) {
                moves.push(`${x}${y}`);
            } else {
                if (target.color !== color) moves.push(`${x}${y}`);
                break;
            }
        }
    }
    return moves;
}

/**
 * Récupère la liste des coups possible pour un fou (ou dame) donné
 */
function getBishopMoves(col, row, color) {
    let moves = [];
    // Directions: diagonales
    for (let d of [
        [-1, -1], [-1, 1], [1, -1], [1, 1]
    ]) {
        let [dx, dy] = d;
        let x = col, y = row;
        while (true) {
            x += dx; y += dy;
            if (x < 1 || x > 8 || y < 1 || y > 8) break;
            let target = getPiece(`${x}${y}`);
            if (!target) {
                moves.push(`${x}${y}`);
            } else {
                if (target.color !== color) moves.push(`${x}${y}`);
                break;
            }
        }
    }
    return moves;
}

/**
 * Récupère la liste des coups possible pour un cavalier donné
 */
function getKnightMoves(col, row, color) {
    let moves = [];
    let deltas = [
        [-2, +1], [-2, -1], [+2, +1], [+2, -1],
        [+1, +2], [-1, +2], [+1, -2], [-1, -2]
    ];
    for (let [dx, dy] of deltas) {
        let x = col + dx, y = row + dy;
        if (x > 0 && x < 9 && y > 0 && y < 9) {
            let target = getPiece(`${x}${y}`);
            if (!target || target.color !== color) {
                moves.push(`${x}${y}`);
            }
        }
    }
    return moves;
}

/**
 * Récupère la liste des coups possible pour un roi donné
 */
function getKingMoves(col, row, color) {
    let moves = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            let x = col + dx, y = row + dy;
            if (x > 0 && x < 9 && y > 0 && y < 9) {
                let target = getPiece(`${x}${y}`);
                if (!target || target.color !== color) {
                    moves.push(`${x}${y}`);
                }
            }
        }
    }
    // TODO: gérer le roque

    // Roque
    let kingSquare = `${col}${row}`;
    let king = getPiece(kingSquare);
    if (!king.hasMoved && !isInCheck(color)) {
        // Petit roque (côté roi)
        if (canCastle(color, 'king')) {
            moves.push(`${col+2}${row}`);
        }
        // Grand roque (côté dame)
        if (canCastle(color, 'queen')) {
            moves.push(`${col-2}${row}`);
        }
    }
    return moves;
}

/**
 * Vérifie si le roi peut faire un roque
 * Amélioration possible dans le futur => utiliser le FEN directement
 */
function canCastle(color, side) {
    let row = (color === 'w') ? 1 : 8; // ligne du roi
    let rookCol = (side === 'king') ? 8 : 1;
    let rook = getPiece(`${rookCol}${row}`);

    if (!rook || rook.type !== 'r' || rook.color !== color || rook.hasMoved) return false;
    
    // Cases entre roi et tour doivent être vides
    let pieceBetween = (side === 'king') ? [6,7] : [2,3,4];
    for (let c of pieceBetween) {
        if (getPiece(`${c}${row}`) != null) return false;
    }

    // Le roi ne doit pas traverser une case attaquée
    let colsKingPass = (side === 'king') ? [6,7] : [4,3];
    for (let c of colsKingPass) {
        if (!isLegalMove(`5${row}`, `${c}${row}`)) return false;
    }

    return true;
}


/**
 * Vérifie si un mouvement donné est légal => il ne laisse pas le roi en échec.
 * Simule le déplacement, vérifie l'état du roi, puis restaure la position.
 * Renvoie true si le mouvement ne laisse pas le roi en échec, sinon false
 */
function isLegalMove(from, to) {
    // Trouve la pièce à déplacer
    const pFrom = getPiece(from);
    if (!pFrom) return false;

    // Sauvegarde l'état initial
    const pTo = getPiece(to);

    // Simule le déplacement
    setPiece(to, pFrom);
    setPiece(from, null);

    // Vérifie l'état du roi après le déplacement
    const checked = isInCheck(pFrom.color);

    // Annule la simulation
    setPiece(from, pFrom);
    pTo != null ? setPiece(to, pTo) : setPiece(to, null);

    //isInCheck = true => est en echec donc coup pas légal
    return !checked; 
}
/***************************************************************************
 ***************************************************************************/


/*************************************
 * Fonctions sur l'état de la partie *
 *************************************/
/**
 * Supprime les différents affichages non nécessaire
 * Met à jour le FEN
 * Passe au tour suivant
 * Vérifie si le joueur peut jouer, si non => fin de partie
 */
function nextTurn() {
    setHighlight(false);
    setHintMoves(false);
    setCheckHighlight(false)
    
    updateFEN(); //Utile si on veut sauvegarder l'état d'une partie (et l'afficher en cas de besoin)
    turn = currentFen.split(" ")[1];
    turn == 'w' ? document.getElementById('turn').innerText = 'Trait aux blanc' : document.getElementById('turn').innerText = 'Trait aux noir';

    renderBoard();
    if (!canAnyPieceMove(turn)) {
        endGame(isInCheck(turn)); // true = mat, false = pat
    } else {
        setCheckHighlight(isInCheck(turn), turn);
    }
}
/**
 * Si un joueur se rend, fin de partie immédiat
 */
function surrender() {
    document.getElementById("surrender").style.visibility = 'hidden';
    endGame(true);
}
/**
 * Met fin à la partie, affiche les informations et bloque l'échéquier
 * True = mat, False = pat
 */
function endGame(mat) {
    let modal = document.getElementById('endgame-modal');
    let msg = modal.querySelector('.endgame-modal-message');
    let btn = modal.querySelector('.endgame-modal-btn');
    let winner = (turn === 'w') ? 'Noir' : 'Blanc';
    
    if (mat) {
        msg.innerHTML = `Échec et mat ! <b>${winner}</b> gagne.`;
    } else {
        msg.innerHTML = `<b>Pat</b> ! Partie nulle, égalité.`;
    }
    
    modal.style.display = 'flex';

    // Bloque tous les clics hors de la boîte
    modal.onclick = function(e) { e.stopPropagation(); e.preventDefault(); };
    modal.querySelector('.endgame-modal-box').onclick = function(e) { e.stopPropagation(); };

    btn.onclick = function(e) {
        e.stopPropagation();
        modal.style.display = 'none';
        newGame();
    };

    // Empêche le focus ailleurs
    document.activeElement && document.activeElement.blur();
    btn.focus();
}

/**
 * Traduire la position actuelle des pièces en notation FEN
 * A faire si besoin :
 *  - Compteur des demi-coups et coups
 *  - Notation du coup en-passant
 */
function updateFEN() {
    let probe;
    let emptyCounter = 0;
    let strForFen = "";

    // Parcourir le plateau et noter la position des pièces (des noirs vers les blancs)
    currentFen = "";
    for (let row = 8; row > 0; row--) {
        strForFen = ""
        emptyCounter = 0;
        for (let col = 1; col < 9; col++) {
            probe = getPiece(`${col}${row}`);
            if (!probe) {
                emptyCounter++;
            } else {
                let t = probe.type
                if (probe.color == 'w') t = probe.type.toUpperCase();
                emptyCounter != 0 ? strForFen = strForFen+emptyCounter+t : strForFen = strForFen+t;
                emptyCounter = 0;
                
            }
            emptyCounter == 8 ? strForFen = '8' : null;
            col == 8 ? strForFen = strForFen+'/' : null;
        }
        currentFen = currentFen+strForFen
        row == 1 ? currentFen = currentFen.slice(0,-1) : null
    }

    // Passe à la couleur du prochain joueur
    turn == 'w' ? currentFen = currentFen + ' b' : currentFen = currentFen + ' w';

    // Gestion notaion roque
    let castling = "";
    let wK = getPiece("51"), wRk = getPiece("81"), wRq = getPiece("11");
    let bK = getPiece("58"), bRk = getPiece("88"), bRq = getPiece("18");

    // Si roi blanc et n'a pas bougé
    if (wK && wK.type === 'k' && wK.color === 'w' && !wK.hasMoved) {
        if (wRk && wRk.type === 'r' && !wRk.hasMoved) castling += "K";
        if (wRq && wRq.type === 'r' && !wRq.hasMoved) castling += "Q";
    }
    // Si roi noir et n'a pas bougé
    if (bK && bK.type === 'k' && bK.color === 'b' && !bK.hasMoved) {
        if (bRk && bRk.type === 'r' && !bRk.hasMoved) castling += "k";
        if (bRq && bRq.type === 'r' && !bRq.hasMoved) castling += "q";
    }
    // S'il n'y a pas de roque possible
    if (castling === "") castling = "-";

    currentFen += " " + castling;

    // En passant (non géré pour l'instant)
    currentFen += " -";

    // Compteurs demi-coups et coups (à implémenter si besoin)
    currentFen += " 0 1";
}