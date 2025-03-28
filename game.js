const fs = require('fs');
const xml2js = require('xml2js');

function getCards(filename) {
    try {
        return JSON.parse(fs.readFileSync(filename.replace('.xml', '.json')));
    } catch {
        let parser = new xml2js.Parser();
        let content;
        var data = fs.readFileSync(filename);
        parser.parseString(data, (err, res) => {
            content = res;
        });
        fs.writeFileSync(filename.replace('.xml', '.json'), JSON.stringify(content, null, 2));
        return content;
    }
}

var data = getCards("cards.xml");

// Reads colors from the config file

var colors = {}

try {
    data.tres.colors[0].color.map((e) => { colors[e["$"].name] = e["$"].id; });
} catch {
    colors = {
        red: 'r',
        green: 'g',
        blue: 'b',
        yellow: 'y'
    };
}

// Reads cards from the config file

var ids = {};

try {
    data.tres.cards[0].card.map((e) => { ids[e["$"].name] = e["$"].id });
} catch {
    ids = {
        zero: '0',
        one: '1',
        two: '2',
        three: '3',
        four: '4',
        five: '5',
        six: '6',
        seven: '7',
        eight: '8',
        nine: '9',
        skip: 'sk',
        reverse: 'rv',
        draw2: 'd2',
        wild: 'w',
        wild4: 'w4'
    };
}

var cprops = {}

try {
    data.tres.cards[0].card.map((e) => { cprops[e["$"].id] = e["$"] });
} catch {
    cprops = {
        'd2': {
            isDraw: true,
            drawAmt: 2
        },
        'sk': {
            isSkip: true
        },
        'rv': {
            isReverse: true
        },
        'w': {
            isWild: true
        },
        'w4': {
            isWild: true,
            isDraw: true,
            drawAmt: 4
        }
    }
}

for (key in cprops) {
    cprops[key].isWild = eval(cprops[key].isWild || 'false');
    cprops[key].isDraw = eval(cprops[key].isDraw || 'false');
    cprops[key].drawAmt = eval(cprops[key].drawAmt || 0);
    cprops[key].isReverse = eval(cprops[key].isReverse || 'false');
    cprops[key].isSkip = eval(cprops[key].isSkip || 'false');
}

const COLORS = colors;

const IDS = ids;

const CPROPS = cprops;

const DEFAULT_OPTS = {
    draw_until: false
};

/**
 * 
 * @param {Number} n number to clamp
 * @param {Number} maxval max value
 * @returns {Number} num between `0` and `maxval - 1`
 */
const clamp = (n, maxval) => (n >= maxval) ? (n % maxval) : ((n < 0) ? (maxval + n) : n);

class Card {
    /**
     * @name constructor
     * @param {String} c card color
     * @param {String} ID card ID
     * @param {Boolean} iW is wild?
     * @param {Boolean} iD is draw?
     * @param {Number} dA draw amount
     * @param {Boolean} iR is reverse?
     * @param {Boolean} iS is skip?
     */
    constructor(c, ID, iW = false, iD = false, dA = 0, iR = false, iS = false) {
        this.color = c;
        this.id = ID;
        this.isWild = iW;
        this.isDraw = iD;
        this.drawAmt = dA;
        this.isReverse = iR;
        this.isSkip = iS;
        this.iWc = null; // internally sets to null to check if the wild has a color or not set by the player
    }
    /**
     * 
     * @returns {String}
     */
    toString() {
        return `${this.color}_${this.id}`;
    }

    toJSON() {
        return this.toString();
    }

    /**
     * 
     * @param {Card} otherCard Other card
     * @returns {boolean} whether the card matches or not
     */
    matches(otherCard) {
        if (otherCard.isWild && ((otherCard.iWc == this.color) || (otherCard.iWc === null))) {
            return true;
        }
        if (this.isWild && (this.iWc === null)) {
            return true;
        }
        return (otherCard.color == this.color) || (otherCard.id == this.id);
    }
}

/**
 * 
 * @param {any[]} arr array of things
 * @returns {any} random item from array of things
 */
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const C = Object.keys(colors);
const I = Object.keys(ids);

/**
 * 
 * @param {Number} ncards Number of cards to "draw"
 * @param {Map<String, String>} colors Collection of colors to use
 * @param {Map<String, String>} ids Collection of ids to use
 * @returns {Card[]}
 */
function drawN(ncards, colors, ids) {
    retdeck = [];
    for (var i = 0; i < ncards; i++) {
        let cID = ids[randomItem(I)]; // Random ID
        retdeck.push(new Card(
            colors[randomItem(C)],
            cID,
            CPROPS[cID].isWild,
            CPROPS[cID].isDraw,
            CPROPS[cID].drawAmt,
            CPROPS[cID].isReverse,
            CPROPS[cID].isSkip
        )); // Card initialization
    }
    return retdeck
}

class Player {
    /**
     * 
     * @param {Number} ccount Number of cards to init with
     */
    constructor(ccount) {
        this.deck = drawN(ccount, COLORS, IDS);
    }

    /**
     * 
     * @param {Number} idx deck card index
     * @returns 
     */
    getCard(idx) {
        return this.deck[idx];
    }

    /**
     * 
     * @param {Number} idx deck card index
     * @returns {Card} card popped
     */
    popCard(idx) {
        return this.deck.splice(idx, 1)[0];
    }

    /**
     * 
     * @param {Boolean} until draw until a card that is drawn matches
     * @param {Card|null} toMatch pass a card to match if `until` is true
     */
    draw(until = false, toMatch = null) {
        const invalidargs = !(!until && !((toMatch === null) || (toMatch === undefined)));
        do {
            this.deck.push(drawN(1, COLORS, IDS)[0]);
        } while ((until && (this.deck[this.deck.length - 1] != toMatch)) && invalidargs);
    }

    drawN(n = 1) {
        this.deck.push(...drawN(n, COLORS, IDS));
    }

    // Basic functions for if the player has either a wild or draw in their deck that matches

    hasWild = (C) => this.deck.some((c) => (c.isWild && (C.matches(c) || c.matches(C))));

    hasDraw = (C) => this.deck.some((c) => (c.isDraw && (C.matches(c) || c.matches(C))));
}

class Game {
    /**
     * 
     * @param {Card} startCard starting card
     * @param {Number} dcards number of cards default to draw for each new player, default is 7
     * @param {Map<String, Boolean>} options game options
     * @param {Map<String, Player>} players player map of string to player object
     */
    constructor(startCard, dcards = 7, options = {}, players = {}) {
        this.pcards = players;
        this.plist = Object.keys(players);
        this.dcards = dcards;
        this.pidx = 0;
        this.cC = startCard;
        this.options = options ? options : DEFAULT_OPTS;
    }

    /**
     * 
     * @param {String} pID player ID
     * @param {Number} ncards number of cards to start with, default is game default card draw amount
     * 
     * @returns {Number} player turn index
     */
    join(pID, ncards = this.dcards) {
        if (this.plist.findIndex((item) => { return (item == pID); }) != -1) {
            return -1;
        }
        this.pcards[pID] = new Player(ncards);
        this.plist.push(pID);
        return this.plist.length - 1;
    }

    /**
     * 
     * @param {String} pID player ID
     */
    leave(pID) {
        if (this.plist.findIndex((item) => { return (item == pID); }) == -1) {
            return;
        }
        delete this.pcards[pID];
        delete this.plist[this.plist.findIndex((item) => { return (item == pID); })];
        // Rewinds and cycles the player index
        this.pidx--;
        this.cycle();
    }

    /**
     * 
     * @param {String} pID player ID 
     * @param {Number} didx player deck card index (card to play)
     * @returns {Number} status (-2, -1 or 0)
     */
    play(pID, didx) {
        if (this.plist[this.pidx] != pID) {
            return -2; // Return -2 for out of turn play
        }

        if (!this.canPlay(this.pcards[pID].getCard(didx))) {
            return -1; // Return -1 for a mismatched card
        }

        // Cycles turn
        this.cycle();

        // Grabs valid card
        let validCard = this.pcards[pID].popCard(didx);

        // Reverses turn order if the card has a reversal property
        if (validCard.isReverse) {
            this.plist.reverse();
            this.pcards.reverse();
            this.pidx = this.plist - (this.pidx + 1);
        }

        // Skips next player if the card played is a skip AND NOT a draw
        if (validCard.isSkip && !validCard.isDraw) {
            this.cycle();
        }

        // if the next player doesn't have a draw card, make them draw the stacked amount
        if (validCard.isSkip && validCard.isDraw && !this.pcards[this.plist[this.pidx]].hasDraw(validCard)) {
            this.drawN(this.plist[this.pidx], validCard.drawAmt);
        }

        // If the card played isn't a draw-enabled card, make the player who played the card draw cards
        if ((this.cC.drawAmt > 0) && (validCard.drawAmt == 0)) {
            this.drawN(this.plist[clamp(this.pidx - 1, this.plist.length)], this.cC.drawAmt);
        }

        // Sets current card to valid card and adjusts for stacking
        if (validCard.drawAmt == 0) {
            this.cC = validCard;
        } else {
            let d = this.cC.drawAmt;
            this.cC = validCard;
            this.cC.drawAmt += d;
        }
        return 0; // Return 0 for success
    }

    /**
     * 
     * @param {String} pID player ID
     */
    setWild(color) {
        if (this.cC.isWild) {
            this.cC.color = color;
            this.cC.iWc = color;
        }
    }

    /**
     * Handles incrementing and cycling of player index
     */
    cycle() {
        this.pidx++;
        this.pidx %= this.plist.length;
    }

    /**
     * 
     * @returns {Number} player turn
     */
    getTurn = () => this.pidx;

    /**
     * 
     * @param {String} pID player ID
     */
    draw(pID) {
        this.pcards[pID].draw(this.options['draw_until'], this.cC);
    }

    /**
     * 
     * @param {String} pID player ID 
     * @param {Number} n number of cards to draw
     */
    drawN(pID, n = 1) {
        this.pcards[pID].drawN(n);
    }

    /**
     * 
     * @param {Card} card Card to play 
     * @returns {boolean} If card can be played
     */
    canPlay(card) {
        return card.matches(this.cC);
    }

    /**
     * 
     * @param {String} pID player ID
     * @returns {Player} player object
     */
    getPCards(pID) {
        return this.pcards[pID];
    }
}

module.exports.COLORS = COLORS;
module.exports.IDS = IDS;
module.exports.Card = Card;
module.exports.randomItem = randomItem;
module.exports.drawN = drawN;
module.exports.Player = Player;
module.exports.Game = Game;