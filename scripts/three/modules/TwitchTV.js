import {
    CSS3DObject
} from "./CSS3DRenderer.js"

var TwitchTV = function(channel) {
    this.channel = channel;

    this.ready = false;
    this.width = 1920;
    this.height = 1080;
    this.position = {
        x: 2000,
        y: 690,
        z: 3600
    };

    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
        this.width = this.width / 2;
        this.height = this.height / 2;
        this.videoWidth = this.videoWidth / 2;
    }

    this.player;
    this.volume = 25;
    this.muted = false;

    this.domElement = document.createElement( 'div' );
    this.domElement.setAttribute("id", "embed");
    this.domElement.setAttribute("class", "no-event");
    this.domElement.style.width = this.width + 'px';
    this.domElement.style.height = this.height + 'px';
    this.domElement.style.opacity = 1;
    this.domElement.style.zIndex = 2;

    this.object = new CSS3DObject( this.domElement );
    this.object.position.set(this.position.x, this.position.y, this.position.z);
    this.object.lookAt(this.position.x, this.position.y, this.position.z - 1);

    var thisEmbed = this;

    this.init = function() {
        var tag = document.createElement('script');
        tag.src = "https://embed.twitch.tv/embed/v1.js";
        tag.onload = this.embedInit;
        document.body.appendChild(tag);
    };

    this.embedInit = function() {
        var twitchPlayer = new Twitch.Embed("embed", {
            width: thisEmbed.width,
            height: thisEmbed.height,
            autoplay: false,
            muted: true,
            channel: thisEmbed.channel,
            allowfullscreen: false,
            theme: "dark",
            layout: "video"
        });

        twitchPlayer.addEventListener(Twitch.Embed.READY, () => {
            thisEmbed.player = twitchPlayer.getPlayer();
            thisEmbed.ready = true;
        });
    };

    this.twitchVolume = function() {
        return (this.volume / 100);
    };

    this.start = function() {
        if(this.ready) {
            this.play();
            this.unmute();
            this.player.setVolume(this.twitchVolume());
        }
    };

    this.play = function() {
        if(this.ready) {
            this.player.play();
        }
    };

    this.pause = function() {
        if(this.ready) {
            this.player.pause();
        }
    };

    this.stop = function() {
        this.pause();
    };

    this.isPaused = function() {
        return this.player.isPaused();
    };

    this.togglePause = function() {
        if(this.ready) {
            if(this.isPaused()) {
                this.play();
            } else {
                this.pause();
            }
        }
    };

    this.mute = function() {
        if(this.ready) {
            this.muted = true;
            this.player.setMuted(this.muted);
        }
    };

    this.unmute = function() {
        if(this.ready) {
            this.muted = false;
            this.player.setMuted(this.muted);
        }
    };

    this.toggleMute = function() {
        if(this.ready) {
            if(this.isMuted()) {
                this.unmute();
            } else {
                this.mute();
            }
        }
    };

    this.volumeDown = function() {
        if(this.ready) {
            if(this.isMuted()) {
                return;
            }

            this.volume = this.volume - 5;
            if(this.volume < 0) {
                this.volume = 0;
            }

            this.player.setVolume(this.twitchVolume());
        }
    };

    this.volumeUp = function() {
        if(this.ready) {
            this.unmute();
            this.volume = this.volume + 5;
            if(this.volume > 100) {
                this.volume = 100;
            }

            this.player.setVolume(this.twitchVolume());
        }
    };

    this.setVolume = function(vol) {
        if(this.ready) {
            this.volume = vol;
            this.player.setVolume(this.twitchVolume());
        }
    };

    this.isMuted = function() {
        if(!this.ready) {
            return false
        }

        return this.muted;
    };

    this.getVolume = function() {
        if(!this.ready) {
            return 0
        }

        return this.volume;
    };

    this.isReady = function() {
        return this.ready;
    };
}

export { TwitchTV }