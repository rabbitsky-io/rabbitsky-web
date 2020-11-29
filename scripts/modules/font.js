
var Font = function() {
    this.ready = false;

    var that = this;

    WebFont.load({
        google: {
            families: [ 'Press Start 2P' ]
        },
        active: function() {
            that.ready = true;
        }
    });

    this.isReady = function(){
        return this.ready;
    }
}

export { Font }
