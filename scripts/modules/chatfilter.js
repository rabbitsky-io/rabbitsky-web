var ChatFilter = function(){

    this.enabled = true;

    this.ready = false;

    this.bannedList = [];

    this.xhr = new XMLHttpRequest();
    this.xhr.timeout = 3000;

    var that = this;

    this.xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            if(this.status == 200) {
                that.bannedList = this.responseText.split("\n");
            }

            that.ready = true;
        }
    };

    this.xhr.ontimeout  = function() {
        that.ready = true;
    }

    this.xhr.open("GET", "extras/chatfilter.txt?v=" + Date.now(), true);
    this.xhr.send();

    this.isReady = function() {
        return this.ready;
    };

    this.enable = function() {
        this.enabled = true;
    }

    this.disable = function() {
        this.enabled = false;
    }

    this.replaceStar = function(text) {
        var star = "";
        for(var i = 0; i < text.length; i++) {
            star += "*";
        }

        return star;
    }

    this.filter = function(text) {
        if(!this.enabled) {
            return text;
        }

        if(text == "") {
            return text;
        }

        for(var i = 0; i < this.bannedList.length; i++) {
            var trimBanned = this.bannedList[i].trim();

            if(trimBanned != "") {
                if(text.indexOf(trimBanned) >= 0) {
                    text = text.replace(trimBanned, this.replaceStar(trimBanned));
                }
            }
        }

        return text;
    }

}

export { ChatFilter }