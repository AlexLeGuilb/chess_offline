let board = document.getElementById('board');
let currentFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let turn = currentFen.split(" ")[1];
let whiteAttackingSquare = [];
let blackAttackingSquare = [];

/**
 * Remettre à zéro
 * Créer les cases
 * Ajouter les pièces
 * Modifier les infos
 */
function newGame(startingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
    document.getElementById("board").innerHTML = "";
    document.getElementById("turn").innerText = "";
    document.getElementById("check").innerText = "";
    document.getElementById("beforeStart").innerText = "Jeux d'échec multijoueur en local";

    currentFen = startingFen;
    turn = currentFen.split(" ")[1];
    displayFEN(startingFen);

    document.getElementById("beforeStart").innerText = "";
    turn == 'w' ? document.getElementById('turn').innerText = 'Trait aux blanc' : document.getElementById('turn').innerText = 'Trait aux noir';

    updateInCheck();
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


/**
 * Liste des fonctions pour bouger les pièces :
 *      - mousedown => Sauvegarde de la pièce initiale + préparation des autres cases.
 *      - mousemouve => Bouger la pièces avec le curseur.
 *      - mouseup => Gérer l'interaction en fonction de où la pièce est lachée.
 *
 * Param pour la pièce en mouvement :
 *      - dgP => "draggedPiece" est la pièce bougée par le joueur
 *      - pClass => Classe "square-xx" de la case de départ de la pièce
 */
let dgP = null;
let pClass = '';
document.addEventListener('mousedown', function(e) {
    if (e.target.classList.contains('piece') && e.button == 0) { //button == 0 => click gauche
        // Sauvegarde de la pièce bougée
        dgP = e.target;
        pClass = Array.from(dgP.classList).find(cls => cls.startsWith('square-'));

        // Amener la pièce devant (pour eviter quelle passe sous une autre)
        dgP.style.zIndex = 10;
        //Mettre le centre de la pièce sur le curseur
        dgP.style.position = "absolute"; //Ne pas mettre "relative"
        dgP.style.top = (e.clientY - (dgP.getBoundingClientRect().width / 2)) + 'px'
        dgP.style.left = (e.clientX - (dgP.getBoundingClientRect().width / 2)) + 'px'
        //Changer le curseur
        dgP.style.cursor = "grabbing";

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        //Set highlight et hint
        setHighlightAndHint(pClass, dgP.classList[2][0], dgP.classList[2][1]); //square-xx, color (w/b), type (p/q/r/k/n/b)
        
        //Supprimer la classe "square-xx" pour cancel la propriété "transform"
        dgP.classList.remove(...Array.from(dgP.classList).filter(cls => cls.startsWith('square-')));
    }
});

function onMouseMove(e) {
    if (!dgP) return;
    if (e.button != 0) return; // Redondant but just to be sure
    // Centrer la pièce sur le curseur
    dgP.style.top = (e.clientY - (dgP.getBoundingClientRect().width / 2)) + 'px'
    dgP.style.left = (e.clientX - (dgP.getBoundingClientRect().width / 2)) + 'px'
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
                nextTurn(); // Prepare the board for the next turn
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


/**
 * Avec la pièce passée en paramètre :
 * Si est déjà sélectionnée, remove hint et hightlight
 * Si n'est pas déjà sélectionnée ajout des hint et highlight
 */
function setHighlightAndHint(oriClass, pColor, pType) {
    // Vérifie si la pièce sélectionnée est du bon camp
    if (pColor !== turn) {
        document.querySelectorAll('[class*="highlight"]').forEach(item => item.remove());
        document.querySelectorAll('[class*="hint"]').forEach(item => item.remove());
        return;
    }

    // Vérifie si la pièce est déjà sélectionnée (highlightée)
    const currentHighlight = Array.from(document.querySelectorAll('[class*="highlight"]'))
        .find(div => div.classList.contains(oriClass));
    if (currentHighlight) {
        return;
    }

    // Sinon, retire les anciens highlights/hints et ajoute le nouveau highlight
    document.querySelectorAll('[class*="highlight"]').forEach(item => item.remove());
    document.querySelectorAll('[class*="hint"]').forEach(item => item.remove());

    let divH = document.createElement('div');
    divH.classList.add('cell', oriClass);

    // Détermine la couleur de la case pour le style de surbrillance
    let col = parseInt(oriClass[7]);
    let row = parseInt(oriClass[8]);
    (col + row) % 2 === 0 ? divH.classList.add('highlight-dark') : divH.classList.add('highlight-light');
    board.prepend(divH);

    // Génère les coups possibles (hints) pour la pièce sélectionnée
    generateHintMoves(oriClass, pColor, pType);
}


/**
 * Fonction qui génère les hint des coups possible pour une pièce donnée
 */
function generateHintMoves(oriClass, pColor, pType) {
    switch (pType) {
        case 'p':
            pawnHint(oriClass[7], oriClass[8], pColor);
            break;
        case 'r':
            rookHint(oriClass[7], oriClass[8], pColor);
            break;
        case 'b':
            bishopHint(oriClass[7], oriClass[8], pColor);
            break;
        case 'q':
            rookHint(oriClass[7], oriClass[8], pColor);
            bishopHint(oriClass[7], oriClass[8], pColor);
            break;
        case 'k':
            kingHint(oriClass[7], oriClass[8], pColor);
            break;
        case 'n':
            knightHint(oriClass[7], oriClass[8], pColor);
            break;
        default:
            break;
    }
}

/**
 * Génère tous les coups possible pour un pion
 * TODO : la règle du "en passant"
 */
function pawnHint(startX, startY, color, currentCheck = false) {
    let isBlock = false;
    let col = parseInt(startX), row = parseInt(startY);
    let sqTest, sqNb;
    let probe;
    let dir = color == 'w' ? 1 : -1;

    // Test les cases en diagonale puis les cases devant
    if (!currentCheck) { //Test de la case devant
        sqNb = ''+col+(row+dir);
        sqTest = 'square-'+sqNb;
        probe = document.querySelectorAll('.'+sqTest);
        probe.length <= 0 ? addHintMoves(sqTest, false) : isBlock = true;

        // Si case devant ok, test de la case+2
        if (!isBlock && ((color == 'w' && row == 2) || (color == 'b' && row == 7))) {
            sqTest = 'square-'+col+(row+(dir*2));
            probe = document.querySelectorAll('.'+sqTest);
            probe.length <= 0 ? addHintMoves(sqTest, false) : isBlock = true;
        }
    }

    // Diag gauche
    if (col > 1) {
        sqNb = ''+(col-1)+(row+dir);
        sqTest = 'square-'+sqNb;
        probe = document.querySelectorAll('.'+sqTest);
        if (probe.length > 0 && probe[0].classList.contains('piece')) {
            probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : null;
        } else {currentCheck ? addAttackedSquare(sqNb, color) : null}
    }
    // Diag droite
    if (col < 8) {
        sqNb = ''+(col+1)+(row+dir);
        sqTest = 'square-'+sqNb;
        probe = document.querySelectorAll('.'+sqTest);
        if (probe.length > 0 && probe[0].classList.contains('piece')) {
            probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : null;
        } else {currentCheck ? addAttackedSquare(sqNb, color) : null}
    }
}

/**
 * Génère tous les coups possible pour la tour
 * Réutilisé pour la dame
 */
function rookHint(startX, startY, color, currentCheck = false) {
    let isBlockL = false, isBlockR = false, isBlockU = false, isBlockD = false;
    let col = parseInt(startX), row = parseInt(startY);
    let sqTest, sqNb;
    let probe;

    for (let x = 1; x < 9; x++) {
        if (!isBlockL && (col-x) > 0) {
            sqNb = ''+(col-x)+(row);
            sqTest = 'square-'+sqNb;
            probe = document.querySelectorAll('.'+sqTest);
            if (probe.length > 0 && probe[0].classList.contains('piece')) {
                probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : isBlockL = true;
                isBlockL = true
            } else {currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, false)}
        } else {isBlockL = true;}

        if (!isBlockR && (col+x) < 9) {
            sqNb = ''+(col+x)+(row)
            sqTest = 'square-'+sqNb;
            probe = document.querySelectorAll('.'+sqTest);
            if (probe.length > 0 && probe[0].classList.contains('piece')) {
                probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : isBlockR = true;
                isBlockR = true
            } else {currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, false)}
        } else {isBlockR = true;}
    }

    for (let y = 1; y < 9; y++) {
        if (!isBlockD && (row-y) > 0) {
            sqNb = ''+(col)+(row-y);
            sqTest = 'square-'+sqNb;
            probe = document.querySelectorAll('.'+sqTest);
            if (probe.length > 0 && probe[0].classList.contains('piece')) {
                probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : isBlockD = true;
                isBlockD = true
            } else {currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, false)}
        } else {isBlockD = true;}

        if (!isBlockU && (row+y) < 9) {
            sqNb = ''+(col)+(row+y);
            sqTest = 'square-'+sqNb;
            probe = document.querySelectorAll('.'+sqTest);
            if (probe.length > 0 && probe[0].classList.contains('piece')) {
                probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : isBlockU = true;
                isBlockU = true
            } else {currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, false)}
        } else {isBlockU = true;}
    }
}

/**
 * Génère tous les coups possible pour le fou
 * Réutilisé pour la dame
 */
function bishopHint(startX, startY, color, currentCheck = false) {
    let isBlockL = false, isBlockR = false, isBlockU = false, isBlockD = false;
    let col = parseInt(startX), row = parseInt(startY);
    let sqTest, sqNb;
    let probe;

    for (let x = 1; x < 9; x++) {
        if (!isBlockL && (col-x) > 0 && (row-x) > 0) {
            sqNb = ''+(col-x)+(row-x)
            sqTest = 'square-'+(col-x)+(row-x);
            probe = document.querySelectorAll('.'+sqTest);
            if (probe.length > 0 && probe[0].classList.contains('piece')) {
                probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : isBlockL = true;
                isBlockL = true
            } else {currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, false)}
        } else {isBlockL = true;}

        if (!isBlockR && (col+x) < 9 && (row+x) < 9) {
            sqNb = ''+(col+x)+(row+x)
            sqTest = 'square-'+(col+x)+(row+x);
            probe = document.querySelectorAll('.'+sqTest);
            if (probe.length > 0 && probe[0].classList.contains('piece')) {
                probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : isBlockR = true;
                isBlockR = true
            } else {currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, false)}
        } else {isBlockR = true;}

        if (!isBlockD && (col-x) > 0 && (row+x) < 9) {
            sqNb = ''+(col-x)+(row+x);
            sqTest = 'square-'+(col-x)+(row+x);
            probe = document.querySelectorAll('.'+sqTest);
            if (probe.length > 0 && probe[0].classList.contains('piece')) {
                probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : isBlockD = true;
                isBlockD = true
            } else {currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, false)}
        } else {isBlockD = true;}

        if (!isBlockU && (col+x) < 9 && (row-x) > 0) {
            sqNb = ''+(col+x)+(row-x);
            sqTest = 'square-'+(col+x)+(row-x);
            probe = document.querySelectorAll('.'+sqTest);
            if (probe.length > 0 && probe[0].classList.contains('piece')) {
                probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : isBlockU = true;
                isBlockU = true
            } else {currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, false)}
        }
        else {isBlockU = true;}
    }
}

/**
 * Génère tous les coups possible pour le cavalier
 */
function knightHint(startX, startY, color, currentCheck = false) {
    let moves = [[-2, +1], [-2, -1], [+2, +1], [+2, -1], [+1, +2], [-1, +2], [+1, -2], [-1, -2]]
    let col, row, sqTest, probe, sqNb;
    moves.forEach(m => {
        col = parseInt(startX) + m[0];
        row = parseInt(startY) + m[1];
        sqNb = ''+col+row;
        sqTest = 'square-'+col+row;
        probe = document.querySelectorAll('.'+sqTest);
        if (probe.length > 0 && probe[0].classList.contains('piece')) {
            probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : null;
        } else {currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, false)}
    });
}

/**
 * Génère tous les coups possible pour le roi
 */
function kingHint(startX, startY, color, currentCheck = false) {
    let col, row;
    let sqTest, probe, sqNb;
    for (let r = -1; r < 2; r++) {
        for (let c = -1; c < 2; c++) {
            col = parseInt(startX) + c;
            row = parseInt(startY) + r;
            if ((col > 0 && col < 9) && (row > 0 && row < 9) && ('square-'+col+row != 'square-'+startX+startY)) {
                sqNb = ''+col+row
                sqTest = 'square-'+col+row;
                probe = document.querySelectorAll('.'+sqTest);
                if (probe.length > 0 && probe[0].classList.contains('piece')) {
                    probe[0].classList[2][0] != color ? currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, true) : null;
                } else {currentCheck ? addAttackedSquare(sqNb, color) : addHintMoves(sqTest, false)}
            }
        }
    }
}

/**
 * Fonction qui créé le hint sur la case donnée
 */
function addHintMoves(square, take) {
    console.log('pClass: '+pClass+' | isL: '+isLegalWhenChecked(pClass, 'square-'+square)+' | sq : '+'square-'+square)
    if (isLegalWhenChecked(pClass, 'square-'+square) == false) {
        return;
    }
    let div = document.createElement('div');
    div.classList.add('cell');

    // La case contient une pièce ou non
    if (!take) {
        div.classList.add('hint');
    } else {
        if (document.getElementsByClassName(square)[0].classList[2][1] != 'k') { // On ne peut pas prendre le roi
            div.classList.add('capture-hint');
        }
    }

    div.classList.add(square);
    board.appendChild(div);
}


/**
 * Préparer l'affichage pour le tour suivant
 */
function nextTurn() {
    setHighlightAndHint(); // Remove les hint et les higlight
    updateFEN(); //Utile si on veut sauvegarder l'état d'une partie (et l'afficher en cas de besoin)
    turn = currentFen.split(" ")[1];
    turn == 'w' ? document.getElementById('turn').innerText = 'Trait aux blanc' : document.getElementById('turn').innerText = 'Trait aux noir';
    updateInCheck();
}

/**
 * Vérifier si le roi du joueur actuel est en échec ou non (+ coloration)
 */
function updateInCheck() {
    let sqTest, probe;
    let color;
    let wkc, wkr, bkc, bkr;
    for (row = 1; row < 9; row++) {
        for (col = 1; col < 9; col++) {
            sqTest = 'square-'+col+row;
            probe = document.querySelectorAll('.'+sqTest);
            if (probe.length > 0 && probe[0].classList.contains('piece')) {
                color = probe[0].classList[2][0];
                switch (probe[0].classList[2][1]) {
                    case 'p':
                        pawnHint(col, row, color, true);
                        break;
                    case 'r':
                        rookHint(col, row, color, true);
                        break;
                    case 'b':
                        bishopHint(col, row, color, true);
                        break;
                    case 'q':
                        rookHint(col, row, color, true);
                        bishopHint(col, row, color, true);
                        break;
                    case 'k':
                        kingHint(col, row, color, true);
                        color == 'w' ? wkc = col : bkc = col;
                        color == 'w' ? wkr = row : bkr = row;
                        break;
                    case 'n':
                        knightHint(col, row, color, true);
                        break;
                    default:
                        break;
                }
            }

        }
    }

    if (blackAttackingSquare.includes(''+wkc+wkr)) {
        document.getElementsByClassName('square-'+wkc+wkr)[0].classList.add('is-checked');
    } else {document.getElementsByClassName('square-'+wkc+wkr)[0].classList.remove('is-checked');}
    if (whiteAttackingSquare.includes(''+bkc+bkr)) {
        document.getElementsByClassName('square-'+bkc+bkr)[0].classList.add('is-checked');
    } else {document.getElementsByClassName('square-'+bkc+bkr)[0].classList.remove('is-checked');}
}

/**
 * Return the check state
 */
function isChecked(colorTocheck = turn) {
    let probe = document.querySelectorAll('.is-checked');
    if (probe.length > 0) {
        return probe[0].classList[2][0] == colorTocheck
    } else {return false;}
}


/**
 * Ajoute la case dans la liste des cases attaquées par une couleur
 */
function addAttackedSquare(square, color) {
    if (square.length === 2 &&
        square[0] > 0 && square[0] < 9 &&
        square[1] > 0 && square[1] < 9) {

        // Same same, but different
        //color == 'w' ? !whiteAttackingSquare.includes(square) ? whiteAttackingSquare.push(square) : null : !blackAttackingSquare.includes(square) ? blackAttackingSquare.push(square) : null;
        if (color == 'w') {
            if (!whiteAttackingSquare.includes(square)) {whiteAttackingSquare.push(square);}
        } else {
            if (!blackAttackingSquare.includes(square)) {blackAttackingSquare.push(square);}
        }
    }
}

/**
 * Vérifie si un mouvement donné est légal lorsque le roi est en échec.
 * Simule le déplacement de la pièce, puis vérifie si le roi reste en échec.
 * @param {string} fromClass - Classe de la case de départ (ex: "square-52")
 * @param {string} toClass - Classe de la case d'arrivée (ex: "square-54")
 * @returns {boolean} true si le mouvement sauve le roi, false sinon
 */
function isLegalWhenChecked(fromClass, toClass) {
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

    // Met à jour la FEN et l'état d'échec
    updateFEN();
    updateInCheck();

    // Vérifie si le roi du joueur n'est plus en échec
    const stillChecked = isChecked(originalClasses[2][0]);

    // Annule la simulation
    piece.classList.remove(toClass);
    piece.classList.add(fromClass);
    if (captured && capturedClasses) {
        const newPiece = document.createElement('div');
        newPiece.classList.add(...capturedClasses);
        board.appendChild(newPiece);
    }
    updateFEN();
    updateInCheck();

    return !stillChecked;
}