import {
    CSS3DObject
} from "./CSS3DRenderer.js"

var YouTubeLive = function(ytid) {
    this.ytid = ytid;

    this.ready = false;
    this.width = 1920;
    this.height = 1080;
    this.videoWidth = 1920;
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

    var domElementPlayer = document.createElement( 'div' );
        domElementPlayer.setAttribute("id", "embed-player");
        domElementPlayer.style.width = this.videoWidth + 'px';
        domElementPlayer.style.height = this.height + 'px';
        domElementPlayer.style.display = "inline-block";

    this.domElement.appendChild(domElementPlayer);

    this.object = new CSS3DObject( this.domElement );
    this.object.position.set(this.position.x, this.position.y, this.position.z);
    this.object.lookAt(this.position.x, this.position.y, this.position.z - 1);

    var thisEmbed = this;

    this.init = function() {
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);

        window.onYouTubeIframeAPIReady = function() {
            thisEmbed.embedInit();
        }
    };

    this.embedInit = function() {
        this.player = new YT.Player('embed-player', {
            height: thisEmbed.height,
            width: thisEmbed.width,
            autoplay: 0,
            videoId: thisEmbed.ytid,
            events: {
                'onReady': thisEmbed.embedReady
            }
        });
    };

    this.embedReady = function() {
        thisEmbed.ready = true;
    };

    this.start = function() {
        if(this.ready) {
            this.play();
            this.unmute();
            this.player.setVolume(this.volume);
        }
    };

    this.play = function() {
        if(this.ready) {
            this.player.playVideo();
        }
    };

    this.pause = function() {
        this.stop(); // different with twitch smh my head
    };

    this.stop = function() {
        if(this.ready) {
            this.player.stopVideo(); // different with twitch smh my head
        }
    };

    this.togglePause = function() {
        if(this.ready) {
            if(this.player.getPlayerState() != 1) {
                this.play();
            } else {
                this.pause();
            }
        }
    };

    this.mute = function() {
        if(this.ready) {
            this.muted = true;
            this.player.mute();
        }
    };

    this.unmute = function() {
        if(this.ready) {
            this.muted = false;
            this.player.unMute();
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

            this.player.setVolume(this.volume);
        }
    };

    this.volumeUp = function() {
        if(this.ready) {
            this.unmute();
            this.volume = this.volume + 5;
            if(this.volume > 100) {
                this.volume = 100;
            }

            this.player.setVolume(this.volume);
        }
    };

    this.setVolume = function(vol) {
        if(this.ready) {
            this.volume = vol;
            this.player.setVolume(this.volume);
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

export { YouTubeLive }