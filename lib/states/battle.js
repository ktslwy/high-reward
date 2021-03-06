'use strict';

var STATES = require('../../configs/states');
var BattleScreen = require('../screens/battle/battle-screen');
var OverlayState = require('./overlay-state');
var displayUtil = require('../utils/display-util');
var RegionScreen = require('../screens/region-map/region-screen');

function Battle(game) {
    OverlayState.call(this, game);

    this.game = game;
}

Battle.prototype = Object.create(OverlayState.prototype);

Battle.prototype.init = function(troop1, troop2, x, y) {
    this._troop1 = troop1 || this._troop1;
    this._troop2 = troop2 || this._troop2;
    this._x = x || this._x;
    this._y = y || this._y;
};

Battle.prototype.create = function() {
    OverlayState.prototype.create.call(this, this._openBattleMenu, this);

    if (this._screen) {
        this._screen.resume();
        return;
    }

    var game = this.game;
    var troop1 = this._troop1;
    var troop2 = this._troop2;
    var screen = new BattleScreen(game, troop1, troop2);

    game.stage.addChild(screen);
    this._screen = screen;

    screen.onBattleEnd.add(this._handleBattleEnd.bind(this));

    this._startTimer = setTimeout(function() {
        screen.start();
    }, 1000);

    this._regionScreen = displayUtil.getDisplayChild(game.stage, RegionScreen);
};

Battle.prototype._handleBattleEnd = function(status) {
    var self = this;
    var game = this.game;

    if (status.wonTroopIndex === 0) {
        game.state.start(STATES.Conversation, undefined, undefined, {
            scriptKey: 'battle-lose',
            onEnd: function() {
                self._processBattleEnd(status);
            }
        });
    } else {
        this._processBattleEnd(status);
    }
};

Battle.prototype._processBattleEnd = function(status) {
    var self = this;
    var wonTroopIndex = status.wonTroopIndex;

    setTimeout(function() {
        self._screen.destroy();
        self._screen = undefined;
        if (wonTroopIndex === 1) {
            self._handleWin(status);
        } else if (wonTroopIndex === 0) {
            self._handleLose();
        } else {
            self._handleRetreat();
        }
    }, 700);
};

Battle.prototype._handleWin = function(status) {
    var game = this.game;
    var amount = Math.round(Math.random() * 400 + 50);
    var informationKey = status.endHpTotals[1] / status.startHpTotals[1] > 0.75 ? 'battle-win-easy' : 'battle-win-hard';

    game.gameState.bank += amount;
    game.state.start(STATES.Information, undefined, undefined, {
        speaker: this._troop2.commander.key,
        key: informationKey,
        config: {
            amount: amount
        }
    }, function() {
        game.state.start(STATES.RegionMap);
    });
};

Battle.prototype._handleLose = function() {
    var self = this;
    var game = this.game;
    var commander = this._troop2.commander;

    commander.attrs.hp = commander.attrs.hp <= 0 ? 1 : commander.attrs.hp;
    game.state.start(STATES.Information, undefined, undefined, {
        speaker: commander.key,
        key: 'battle-lose'
    }, function() {
        self._prepareRetreatMove();
        game.state.start(STATES.RegionMap);
    });
};

Battle.prototype._handleRetreat = function() {
    var self = this;
    var game = this.game;
    var troop = this._troop2;

    game.state.start(STATES.Information, undefined, undefined, {
        speaker: troop.commander.key,
        key: 'battle-retreat',
        config: {
            name: troop.lastPoi && troop.lastPoi.name
        }
    }, function() {
        self._prepareRetreatMove();
        game.state.start(STATES.RegionMap);
    });
};

Battle.prototype._prepareRetreatMove = function() {
    var game = this.game;
    var gameState = game.gameState;
    var troop = this._troop2;
    var commanderKey = troop.commander.key;
    var lastPoi = troop.lastPoi;

    if (!lastPoi) {
        return;
    }

    this._regionScreen.findPath(this._x, this._y, lastPoi.x, lastPoi.y, function(points) {
        points = points || [{x: lastPoi.x, y: lastPoi.y}];
        troop.isRetreating = true;
        gameState.troops[commanderKey].movements = points;
        game.state.start(STATES.RegionMap);
    });
};

Battle.prototype._openBattleMenu = function() {
    this.game.state.start(STATES.BattleMenu, undefined, undefined, this._screen);
    this._screen.pause();
};

Battle.prototype.shutdown = function() {
    OverlayState.prototype.shutdown.call(this);
    if (this._startTimer) {
        clearTimeout(this._startTimer);
        this._startTimer = null;
    }
};

module.exports = Battle;
