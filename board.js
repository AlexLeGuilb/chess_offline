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
    turn == 'w' ? document.getElementById('turn').innerText = 'Trait aux blanc' : document.getElementById('turnDisplay').innerText = 'Trait aux noir';
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