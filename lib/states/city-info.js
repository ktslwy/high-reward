'use strict';

var CityInfoScreen = require('../screens/city-info/city-info-screen');
var OverlayState = require('./overlay-state');
var tweenUtil = require('../utils/tween-util');
var Region = require('../components/region');

function CityInfo(game) {
    OverlayState.call(this, game);

    this.game = game;
}

CityInfo.prototype = Object.create(OverlayState.prototype);

CityInfo.prototype.init = function(poi) {
    this._poi = poi;
};

CityInfo.prototype.create = function() {
    var game = this.game;
    var regionInfo = Region.Regions[game.gameState.currentRegion];

    OverlayState.prototype.create.call(this);

    this._screen = tweenUtil.fadeIn(game.stage.addChild(new CityInfoScreen(game, regionInfo, this._poi)));
};

CityInfo.prototype.shutdown = function() {
    OverlayState.prototype.shutdown.call(this);

    this._screen.destroy();
};

module.exports = CityInfo;
