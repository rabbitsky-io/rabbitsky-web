var Config = function() {
    this.ready = false;
    this.error = "";

    this.embed = {
        type: "twitch",   // default to twitch
        id: "monstercat", // default to monstercat channel
        chat: true        // default show chat
    };

    this.servers = [];

    this.xhr = new XMLHttpRequest();
    this.xhr.timeout = 3000;

    var that = this;

    this.xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status == 200) {
                var obj = JSON.parse(this.responseText);

                if(typeof obj.embed !== 'undefined') {
                    if(typeof obj.embed.type !== 'undefined') {
                        that.embed.type = obj.embed.type
                    }

                    if(typeof obj.embed.id !== 'undefined') {
                        that.embed.id = obj.embed.id
                    }

                    if(typeof obj.embed.chat !== 'undefined') {
                        that.embed.chat = obj.embed.chat;
                    }
                }

                if(typeof obj.servers !== 'undefined') {
                    that.servers = obj.servers;
                }
            } else {
                that.error = "Invalid Status Return: " + this.status;
            }

            that.ready = true;
        }
    };

    this.xhr.ontimeout  = function() {
        that.error = "Timed out";
    }

    this.xhr.open("GET", "config.json?v=" + Date.now(), true);
    this.xhr.send();

    this.checkPlayers = function() {
        for(let i = 0; i < this.servers.length; i++) {
            let thisServer = this.servers[i];
            thisServer.fetching = true;

            let xhr = new XMLHttpRequest();

            let scheme = (thisServer.secure) ? "https://" : "http://";
            let url = scheme + thisServer.host + "/channel/players?v=" + Date.now();

            let timeStart;
            thisServer.ping = undefined;

            xhr.onreadystatechange = function() {
                if (this.readyState == 1) {
                    timeStart = Date.now();
                }

                if (this.readyState == 2) {
                    thisServer.ping = Date.now() - timeStart;

                    if(thisServer.ping < 1) {
                        thisServer.ping = 1;
                    }
                }

                if (this.readyState == 4) {
                    if(this.status == 200) {
                        let obj = JSON.parse(this.responseText);
                        thisServer.maxPlayers = obj.max_players;
                        thisServer.players = obj.players;
                        thisServer.canJoin = (obj.players < obj.max_players) ? true : false;
                    } else {
                        thisServer.maxPlayers = 0;
                        thisServer.players = 0;
                        thisServer.canJoin = false;
                    }

                    thisServer.fetching = false;
                }
            };

            xhr.ontimeout = function () {
                thisServer.maxPlayers = 0;
                thisServer.players = 0;
                thisServer.canJoin = false;
                thisServer.fetching = false;
            };

            xhr.open("GET", url, true);
            xhr.send();
            timeStart = Date.now();
        }
    }

    this.isReady = function() {
        return this.ready;
    };

    this.checkError = function() {
        return this.error
    }

}

export { Config }