const DEFAULT_OPTS = {
    draw_until: false
};

const COLORS = {
    red: 'r',
    green: 'g',
    blue: 'b',
    yellow: 'y'
};

const IDS = {
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

class Card {
    /**
     * @name constructor
     * @param {String} c 
     * @param {String} ID 
     * @param {Boolean} iW
     */
    constructor(c, ID, iW = false) {
        this.color = c;
        this.id = ID;
        this.isWild = iW;
    }
    /**
     * 
     * @returns {String}
     */
    toString() {
        return `${this.color}_${this.id}`;
    }

    /**
     * 
     * @returns {String} JSON string
     */
    toJSON() {
        return this.toString();
    }

    /**
     * 
     * @param {Card} otherCard Other card
     * @returns {boolean} whether the card matches or not
     */
    matches(otherCard) {
        if (otherCard.isWild) {
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

/**
 * 
 * @param {Number} ncards Number of cards to "draw"
 * @param {Map<String, String>} colors Collection of colors to use
 * @param {Map<String, String>} ids Collection of ids to use
 * @returns {Card[]}
 */
function drawN(ncards, colors, ids) {
    retdeck = [];
    const C = Object.keys(colors);
    const I = Object.keys(ids);
    for (var i = 0; i < ncards; i++) {
        let cID = ids[randomItem(I)];
        retdeck.push(new Card(colors[randomItem(C)], cID, ((cID == IDS.wild) || (cID == IDS.wild4))));
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
        return this.deck.splice(idx, 1);
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
     */
    join(pID, ncards = this.dcards) {
        if (this.plist.findIndex((item) => { return (item == pID); }) != -1) {
            return;
        }
        this.pcards[pID] = new Player(ncards);
        this.plist.push(pID);
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
        console.log(this.pcards[pID].getCard(didx));
        console.log(this.cC);
        console.log(this.canPlay(this.pcards[pID].getCard(didx)));
        this.pidx = this.pidx++ % this.plist.length;
        this.cC = this.pcards[pID].popCard(didx);
        return 0; // Return 0 for success
    }

    /**
     * 
     * @param {String} pID player ID
     */
    draw(pID) {
        this.pcards[pID].draw(this.options['draw_until'], this.cC);
    }

    /**
     * 
     * @param {Card} card Card to play 
     * @returns {boolean} If card can be played
     */
    canPlay(card) {
        return this.cC.matches(card);
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