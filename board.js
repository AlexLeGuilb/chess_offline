let board = document.getElementById('board');
let currentFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let turn = currentFen.split(" ")[1];

function newGame(startingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
    document.getElementById("board").innerHTML = "";
    document.getElementById("turn").innerText = "";
    document.getElementById("check").innerText = "";
    document.getElementById("beforeStart").innerText = "Jeux d'échec multijoueur en local";

    document.getElementById('promotion-popup').style.display = 'none';

    currentFen = startingFen;
    turn = currentFen.split(" ")[1];
    displayFEN(startingFen);

    document.getElementById("beforeStart").innerText = "";
    turn == 'w' ? document.getElementById('turn').innerText = 'Trait aux blanc' : document.getElementById('turn').innerText = 'Trait aux noir';

    updateNextAttack();
    if (isInCheck(turn)) {
        setCheckHighlight(turn);
    }
    document.getElementById("surrender").style.visibility = 'visible';
}

/**
 * Lecture de la notation FEN pour afficher les pièces au bon endroit
 */
function displayFEN(fen) {
    let pos = fen.split(" ")[0];
    let row = 8;
    let col = 1;
    let c;
    for (let i = 0; i < pos.length; i++) {
        c = pos[i];
        if (c != '/') {
            if ((!isNaN(c * 1)) && (c > 0 && c < 9)) {
                col = col+parseInt(c);
            } else {
                if ((row > 0 && row < 9) && (col > 0 && col < 9)) {
                    let piece = document.createElement('div');
                    piece.classList.add('cell');
                    piece.classList.add("piece");
                    if (c == c.toUpperCase()) {
                        piece.classList.add("w"+c.toLowerCase());
                    } else {
                        piece.classList.add("b"+c);
                    }
                    piece.classList.add("square-"+col+row);
                    board.appendChild(piece);
                    col = col+1;
                }
            }
        } else {
            row = row-1;
            col = 1;
        }
    }
}

/**
 * Traduire la position actuelle des pièces en notation FEN
 */
function updateFEN() {
    let sq;
    let probe;
    let emptyCounter = 0;
    let pColor, pType;
    let strForFen = "";

    currentFen = "";
    for (let row = 8; row > 0; row--) {
        strForFen = ""
        emptyCounter = 0;
        for (let col = 1; col < 9; col++) {
            sq = '.square-'+col+row;
            probe = document.querySelectorAll(sq);
            if (probe.length > 0) {
                pColor = probe[0].classList[2][0];
                pType = probe[0].classList[2][1];
                pColor == 'w' ? pType = pType.toUpperCase() : null;
                emptyCounter != 0 ? strForFen = strForFen+emptyCounter+pType : strForFen = strForFen+pType;
                emptyCounter = 0;
            } else {
                emptyCounter++;
            }
            emptyCounter == 8 ? strForFen = '8' : null;
            col == 8 ? strForFen = strForFen+'/' : null;
        }
        currentFen = currentFen+strForFen
        row == 1 ? currentFen = currentFen.slice(0,-1) : null
    }

    turn == 'w' ? currentFen = currentFen + ' b' : currentFen = currentFen + ' w';
    currentFen = currentFen + ' KQkq - 0 1';
}


let sqAtkByB = [];
let sqAtkNextByB = []
let sqAtkByW = [];
let sqAtkNextByW = [];
let dgP = null;
let pClass = '';
let pType = '';
let pColor = '';
let isSelected = false;
document.addEventListener('mousedown', function(e) {
    if (e.target.classList.contains('piece') && e.button == 0) { //button == 0 => click gauche
        if (document.getElementById('promotion-popup').style.display == 'none') {
            // Sauvegarde de la pièce bougée
            dgP = e.target;
            pClass = Array.from(dgP.classList).find(cls => cls.startsWith('square-'));
            pColor = dgP.classList[2][0];
            pType = dgP.classList[2][1];

            // Amener la pièce devant (pour eviter quelle passe sous une autre)
            dgP.style.zIndex = 10;
            //Mettre le centre de la pièce sur le curseur
            dgP.style.position = "absolute"; //Ne pas mettre "relative"
            dgP.style.top = (e.clientY - (dgP.getBoundingClientRect().width / 2)) + 'px'
            dgP.style.left = (e.clientX - (dgP.getBoundingClientRect().width / 2)) + 'px'
            //Changer le curseur
            dgP.style.cursor = "grabbing";

            // Sélectionner la pièce (visuellement)
            pColor == turn ? setHighlight(true) : setHighlight(false);

            // Vérifier si la pièce peut bouger
            if (pColor == turn) {
                canMove() ? setHint(true) : console.log('Pas de moves');
            }
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            //Supprimer la classe "square-xx" pour cancel la propriété "transform"
            dgP.classList.remove(...Array.from(dgP.classList).filter(cls => cls.startsWith('square-')));
        }
    }
});

function onMouseMove(e) {
    if (!dgP) return;
    if (e.button != 0) return; // Redondant but just to be sure
    // Centrer la pièce sur le curseur
    dgP.style.top = (e.clientY - (dgP.getBoundingClientRect().width / 2)) + 'px';
    dgP.style.left = (e.clientX - (dgP.getBoundingClientRect().width / 2)) + 'px';
}

function onMouseUp(e) {
    if (!dgP) return;
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
        dgP.classList.add(pClass);
    } else {
        // Calculer col and row
        let col = Math.floor((x / boardSize) * 8) + 1; // 1 to 8
        let row = 8 - Math.floor((y / boardSize) * 8); // 8 to 1 (top to bottom)

        // Attacher les valeurs au plateau
        col = Math.max(1, Math.min(8, col));
        row = Math.max(1, Math.min(8, row));

        /**
         * Si la case cible est différente de la case d'origine alors
         *   Si la case cible a la classe "hint" alors on supprime ce quelle contient
         *   Puis on déplace (change de classe) la pièce dans la nouvelle case
         *   Puis on lance le prochain tour
         * Sinon on remet la pièce dans la case d'origine
         */
        const newSquareClass = `square-${col}${row}`;
        if (newSquareClass != pClass) {
            if (document.querySelectorAll('[class*="hint '+newSquareClass+'"]').length > 0) {
                document.querySelectorAll('.'+newSquareClass).forEach(i=>{i.remove()});
                dgP.classList.add(newSquareClass);
                if (pType == 'p') {
                    if ((pColor == 'b' && newSquareClass[8] == 1) || (pColor == 'w' && newSquareClass[8] == 8)) promotePawn(newSquareClass);
                }
                nextTurn();
            } else {
                dgP.classList.add(pClass);
            }
        } else {
            dgP.classList.add(pClass);
        }
    }

    // Reset
    dgP.style.position = '';
    dgP.style.left = '';
    dgP.style.top = '';
    dgP.style.zIndex = '';
    dgP.style.pointerEvents = '';
    dgP.style.cursor = '';

    // Cleanup
    dgP = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

function setHighlight(onOff) {
    document.querySelectorAll('[class*="highlight"]').forEach(item => item.remove());

    if (onOff) {
        let divH = document.createElement('div');
        divH.classList.add('cell', pClass);

        // Détermine la couleur de la case pour le style de surbrillance
        let col = parseInt(pClass[7]);
        let row = parseInt(pClass[8]);
        (col + row) % 2 === 0 ? divH.classList.add('highlight-dark') : divH.classList.add('highlight-light');
        board.prepend(divH);
    }
}

function setCheckHighlight(color) {
    document.querySelectorAll('[class*="is-checked"]').forEach(item => item.remove());
    let king = document.querySelector(`.piece.${color}k`);
    let sqK = Array.from(king.classList).find(cls => cls.startsWith('square-'));

    let divC = document.createElement('div');
    divC.classList.add('cell', sqK, 'is-checked');
    board.prepend(divC);

}

function addHintMoves(square, take) {
    // Create the hint square
    let div = document.createElement('div');
    div.classList.add('cell');

    // Square has piece or not
    if (!take) {
        div.classList.add('hint');
    } else {
        if (document.getElementsByClassName(square)[0].classList[2][1] != 'k') { // Can't take the king
            div.classList.add('capture-hint');
        }
    }

    div.classList.add(square);
    board.appendChild(div);
}

function setHint(onOff) {
    // Nettoie les anciens hints
    document.querySelectorAll('[class*="hint').forEach(item => item.remove());

    if (onOff) {
        let square = getLegalMovesForPiece();
        // Affiche les hints pour chaque coup légal
        square.forEach(move => {
            let targetCell = document.querySelectorAll(`.${move}`);
            if (targetCell.length > 0) {
                targetCell.forEach(tc => {
                    addHintMoves(move, tc.classList.contains('piece'));
                })
            } else {addHintMoves(move, false);}
            
        });
    }
}

function updateNextAttack() {
    sqAtkNextByB = [];
    sqAtkNextByW = [];
    let pieces = document.querySelectorAll('[class*="piece"]');
    let color, type, row, col; //Pièce en cours
    let dir, probe, sqNb; //Outils
    let isBlockU, isBlockD, isBlockL, isBlockR
    pieces.forEach(p => {
        row = parseInt(p.classList[3][8]);
        col = parseInt(p.classList[3][7]);
        color = p.classList[2][0];
        type = p.classList[2][1];
        dir = (color==='w')? 1: -1

        if (type == 'p') {
            let c = col + 1;
            if (c > 0 && c < 9) {
                sqNb = ''+c+(row + dir);
                probe = document.querySelectorAll('.square-'+sqNb);
                if (probe.length > 0 && probe[0].classList.contains('piece')) {
                    if (color != probe[0].classList[2][0]) {
                        color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                    }
                } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
            }
            c = col - 1;
            if (c > 0 && c < 9) {
                sqNb = ''+c+(row + dir);
                probe = document.querySelectorAll('.square-'+sqNb);
                if (probe.length > 0 && probe[0].classList.contains('piece')) {
                    if (color != probe[0].classList[2][0]) {
                        color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                    }
                } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
            }
        }

        // For rook and queen moves
        if (type == 'r' || type == 'q') {
            isBlockU = false; isBlockD = false; isBlockL = false; isBlockR = false;

            for (let x = 1; x < 9; x++) {
                if (!isBlockL && (col-x) > 0) {
                    sqNb = ''+(col-x)+(row);
                    probe = document.querySelectorAll('.square-'+sqNb);
                    if (probe.length > 0 && probe[0].classList.contains('piece')) {
                        if (color != probe[0].classList[2][0]) {
                            color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                        }
                        isBlockL = true
                    } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
                } else {isBlockL = true;}

                if (!isBlockR && (col+x) < 9) {
                    sqNb = ''+(col+x)+(row);
                    probe = document.querySelectorAll('.square-'+sqNb);
                    if (probe.length > 0 && probe[0].classList.contains('piece')) {
                        if (color != probe[0].classList[2][0]) {
                            color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                        }
                        isBlockR = true
                    } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
                } else {isBlockR = true;}
            }

            for (let y = 1; y < 9; y++) {
                if (!isBlockD && (row-y) > 0) {
                    sqNb = ''+(col)+(row-y);
                    probe = document.querySelectorAll('.square-'+sqNb);
                    if (probe.length > 0 && probe[0].classList.contains('piece')) {
                        if (color != probe[0].classList[2][0]) {
                            color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                        }
                        isBlockD = true
                    } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
                } else {isBlockD = true;}

                if (!isBlockU && (row+y) < 9) {
                    sqNb = ''+(col)+(row+y);
                    probe = document.querySelectorAll('.square-'+sqNb);
                    if (probe.length > 0 && probe[0].classList.contains('piece')) {
                        if (color != probe[0].classList[2][0]) {
                            color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                        }
                        isBlockU = true
                    } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
                } else {isBlockU = true;}
            }
        }

        // For bishop and queen moves
        if (type == 'b' || type == 'q') {
            isBlockU = false; isBlockD = false; isBlockL = false; isBlockR = false;

            for (let x = 1; x < 9; x++) {
                if (!isBlockL && (col-x) > 0 && (row-x) > 0) {
                    sqNb = ''+(col-x)+(row-x)
                    probe = document.querySelectorAll('.square-'+sqNb);
                    if (probe.length > 0 && probe[0].classList.contains('piece')) {
                        if (color != probe[0].classList[2][0]) {
                            color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                        }
                        isBlockL = true
                    } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
                } else {isBlockL = true;}

                if (!isBlockR && (col+x) < 9 && (row+x) < 9) {
                    sqNb = ''+(col+x)+(row+x)
                    probe = document.querySelectorAll('.square-'+sqNb);
                    if (probe.length > 0 && probe[0].classList.contains('piece')) {
                        if (color != probe[0].classList[2][0]) {
                            color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                        }
                        isBlockR = true
                    } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
                } else {isBlockR = true;}

                if (!isBlockD && (col-x) > 0 && (row+x) < 9) {
                    sqNb = ''+(col-x)+(row+x);
                    probe = document.querySelectorAll('.square-'+sqNb);
                    if (probe.length > 0 && probe[0].classList.contains('piece')) {
                        if (color != probe[0].classList[2][0]) {
                            color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                        }
                        isBlockD = true
                    } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
                } else {isBlockD = true;}

                if (!isBlockU && (col+x) < 9 && (row-x) > 0) {
                    sqNb = ''+(col+x)+(row-x);
                    probe = document.querySelectorAll('.square-'+sqNb);
                    if (probe.length > 0 && probe[0].classList.contains('piece')) {
                        if (color != probe[0].classList[2][0]) {
                            color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                        }
                        isBlockU = true
                    } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
                }
                else {isBlockU = true;}
            }
        }

        // For knight moves
        if (type == 'n') {
            let moves = [[-2, +1], [-2, -1], [+2, +1], [+2, -1], [+1, +2], [-1, +2], [+1, -2], [-1, -2]]
            let c, r;
            moves.forEach(m => {
                c = col + m[0];
                r = row + m[1];
                if (c > 0 && c < 9 && r > 0 && r < 9) {
                    sqNb = ''+c+r;
                    probe = document.querySelectorAll('.square-'+sqNb);
                    if (probe.length > 0 && probe[0].classList.contains('piece')) {
                        if (color != probe[0].classList[2][0]) {
                            color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                        }
                    } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
                }
            });
        }

        // For king moves
        if (type == 'k') {
            let x, y;
            for (let r = -1; r < 2; r++) {
                for (let c = -1; c < 2; c++) {
                    x = col + c;
                    y = row + r;
                    if ((x > 0 && x < 9) && (y > 0 && y < 9) && ('square-'+x+y != 'square-'+col+row)) {
                        sqNb = ''+x+y
                        probe = document.querySelectorAll('.square-'+sqNb);
                        if (probe.length > 0 && probe[0].classList.contains('piece')) {
                            if (color != probe[0].classList[2][0]) {
                                color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)
                            }
                        } else {color == 'w' ? sqAtkNextByW.push('square-'+sqNb) : sqAtkNextByB.push('square-'+sqNb)}
                    }
                }
            }
        }
    })

    sqAtkNextByW = [...new Set(sqAtkNextByW)];
    sqAtkNextByB = [...new Set(sqAtkNextByB)];
}

function isInCheck(color) {
    let king = document.querySelector(`.piece.${color}k`);
    let sqK = Array.from(king.classList).find(cls => cls.startsWith('square-'));
    
    if (color == 'w') {return sqAtkNextByB.includes(sqK)} else {return sqAtkNextByW.includes(sqK)}
}

/**
 * Vérifie si la pièce sélectionnée peut bouger sans mettre son roi en échec.
 * Affiche uniquement les "hint" pour les coups légaux.
 * @returns {boolean} true si au moins un coup légal existe, false sinon
 */
function canMove() {
    let legalMoves = getLegalMovesForPiece();
    return legalMoves.length > 0;
}

/**
 * Génère tous les coups légaux pour une pièce donnée (ne laisse pas le roi en échec).
 * @returns {Array} Liste des cases cibles légales (ex: ["square-53", "square-54"])
 */
function getLegalMovesForPiece(next) {
    let col = parseInt(pClass[7]);
    let row = parseInt(pClass[8]);
    let candidateMoves = [];
    
    switch (pType) {
        case 'p':
            candidateMoves = getPawnMoves(col, row, pColor);
            break;
        case 'r':
            candidateMoves = getRookMoves(col, row, pColor);
            break;
        case 'n':
            candidateMoves = getKnightMoves(col, row, pColor);
            break;
        case 'b':
            candidateMoves = getBishopMoves(col, row, pColor);
            break;
        case 'q':
            candidateMoves = [
                ...getRookMoves(col, row, pColor),
                ...getBishopMoves(col, row, pColor)
            ];
            break;
        case 'k':
            candidateMoves = getKingMoves(col, row, pColor);
            break;
        default:
            break;
    }

    // Filtre les coups qui laissent le roi en échec
    return candidateMoves.filter(targetClass => isLegalMove(pClass, targetClass));
}

function getPawnMoves(col, row, color) {
    let moves = [];
    let dir = color === 'w' ? 1 : -1;
    let startRow = color === 'w' ? 2 : 7;

    // Avance d'une case
    let fwdRow = row + dir;
    if (fwdRow > 0 && fwdRow < 9) {
        let fwd = `square-${col}${fwdRow}`;
        if (!document.querySelector(`.${fwd}.piece`)) {
            moves.push(fwd);
            // Avance de deux cases depuis la position initiale
            if (row === startRow) {
                let fwd2Row = row + 2 * dir;
                let fwd2 = `square-${col}${fwd2Row}`;
                if (!document.querySelector(`.${fwd2}.piece`)) {
                    moves.push(fwd2);
                }
            }
        }
    }
    // Prises diagonales
    for (let dc of [-1, 1]) {
        let c = col + dc;
        let r = row + dir;
        if (c > 0 && c < 9 && r > 0 && r < 9) {
            let diag = `square-${c}${r}`;
            let target = document.querySelector(`.${diag}.piece`);
            if (target && target.classList[2][0] !== color) {
                moves.push(diag);
            }
        }
    }
    // TODO: gérer "en passant"
    return moves;
}

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
            let sq = `square-${x}${y}`;
            let target = document.querySelector(`.${sq}.piece`);
            if (!target) {
                moves.push(sq);
            } else {
                if (target.classList[2][0] !== color) moves.push(sq);
                break;
            }
        }
    }
    return moves;
}

function getKnightMoves(col, row, color) {
    let moves = [];
    let deltas = [
        [-2, +1], [-2, -1], [+2, +1], [+2, -1],
        [+1, +2], [-1, +2], [+1, -2], [-1, -2]
    ];
    for (let [dx, dy] of deltas) {
        let x = col + dx, y = row + dy;
        if (x > 0 && x < 9 && y > 0 && y < 9) {
            let sq = `square-${x}${y}`;
            let target = document.querySelector(`.${sq}.piece`);
            if (!target || target.classList[2][0] !== color) {
                moves.push(sq);
            }
        }
    }
    return moves;
}

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
            let sq = `square-${x}${y}`;
            let target = document.querySelector(`.${sq}.piece`);
            if (!target) {
                moves.push(sq);
            } else {
                if (target.classList[2][0] !== color) moves.push(sq);
                break;
            }
        }
    }
    return moves;
}

function getKingMoves(col, row, color) {
    let moves = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            let x = col + dx, y = row + dy;
            if (x > 0 && x < 9 && y > 0 && y < 9) {
                let sq = `square-${x}${y}`;
                let target = document.querySelector(`.${sq}.piece`);
                if (!target || target.classList[2][0] !== color) {
                    moves.push(sq);
                }
            }
        }
    }
    // TODO: gérer le roque
    return moves;
}

/**
 * Vérifie si un mouvement donné est légal : il ne laisse pas le roi en échec.
 * Simule le déplacement, vérifie l'état du roi, puis restaure la position.
 * @param {string} fromClass - Classe de la case de départ (ex: "square-52")
 * @param {string} toClass - Classe de la case d'arrivée (ex: "square-54")
 * @returns {boolean} true si le mouvement ne laisse pas le roi en échec, false sinon
 */
function isLegalMove(fromClass, toClass) {
    // Trouve la pièce à déplacer
    const piece = document.querySelector(`.${fromClass}.piece`);
    if (!piece) return false;

    // Sauvegarde l'état initial
    const originalClasses = Array.from(piece.classList);
    const captured = document.querySelector(`.${toClass}.piece`);
    let capturedClasses = null;
    if (captured) capturedClasses = Array.from(captured.classList);

    // Simule le déplacement
    piece.classList.remove(fromClass);
    piece.classList.add(toClass);
    if (captured) captured.remove();

    // Met à jour les attaques et vérifie l'état du roi
    updateNextAttack();
    const stillChecked = isInCheck(originalClasses[2][0]);

    // Annule la simulation
    piece.classList.remove(toClass);
    piece.classList.add(fromClass);
    if (captured && capturedClasses) {
        const newPiece = document.createElement('div');
        newPiece.classList.add(...capturedClasses);
        board.appendChild(newPiece);
    }
    updateNextAttack();

    return !stillChecked;
}

function nextTurn() {
    setHighlight(false);
    setHint(false);
    updateFEN(); //Utile si on veut sauvegarder l'état d'une partie (et l'afficher en cas de besoin)
    turn = currentFen.split(" ")[1];
    turn == 'w' ? document.getElementById('turn').innerText = 'Trait aux blanc' : document.getElementById('turn').innerText = 'Trait aux noir';
    
    updateNextAttack();
    if (isInCheck(turn) && !canMove()) {
        endGame()
    }
    else if (isInCheck(turn) && canMove()) {
        setCheckHighlight(turn);
    }
}

/**
 * Affiche un popup pour choisir la promotion du pion et effectue la promotion.
 */
function promotePawn(newClass) {
    // Crée le popup si non existant
    let popup = document.getElementById('promotion-popup');
    let images = document.getElementsByClassName('promo-img');
    if (!popup) {
        return;
    } else {
        popup.style.display = 'flex';
        // Positionne le popup sous le pion
        let rPawn = dgP.getBoundingClientRect();
        let rBoard = board.getBoundingClientRect();
        let rPop = popup.getBoundingClientRect();


        popup.style.left = (rBoard.left + (newClass[7]*(rBoard.width/8)) - (rPop.width/1.5)) + 'px';
        popup.style.top = (rPawn.bottom) + 'px';
        if (newClass[8] == '8') {
            popup.style.top = (rPawn.top + rPawn.height) + 'px';
        } else {
            popup.style.top = (rBoard.height - rPawn.height) + 'px';
        }

        Array.from(images).forEach(img => {
            let pieceType = img.getAttribute('data-piece');
            img.src = `./img/${pColor}${pieceType}.png`;
            // Ajoute les listeners sur les images
            img.onclick = function() {
                let chosen = pColor+img.getAttribute('data-piece');
                let p = document.querySelector(`.${newClass}.piece`);
                p.classList.remove(pColor + 'p');
                p.classList.add(chosen);
                popup.style.display = 'none';
            }
        });
    }
}

function endGame() {
    let modal = document.getElementById('endgame-modal');
    let msg = modal.querySelector('.endgame-modal-message');
    let btn = modal.querySelector('.endgame-modal-btn');
    let winner = (turn === 'w') ? 'Noir' : 'Blanc';

    msg.innerHTML = `Échec et mat ! <b>${winner}</b> gagne.`;
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

function surrender() {
    nextTurn();
    document.getElementById("surrender").style.visibility = 'hidden';
    endGame();
}