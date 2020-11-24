import {
    Clock, MathUtils
} from "../three.module.js";

import {
    Rabbit
} from "./Rabbit.js";

var WebSocketHandler = function(rabbit, floor) {

    this.rabbit = rabbit;
    this.floor = floor;

    // For changing background color ingame
    this.backgroundDom;
    this.backgroundFlashInterval;

    this.animation = true;
    this.chatEnabled = true;

    this.chatFilter;

    this.disconnectHandler;

    this.connected = false;
    this.disconnectedReason = "";


    // We don't really need float tho
    this.floatToInt = function(float) {
        return Math.round(float);
    }

    // Main Rabbit Past Information for Sending Messages
    this.rabbitPast = {
        x: this.floatToInt(this.rabbit.object.position.x),
        y: this.floatToInt(this.rabbit.object.position.y),
        z: this.floatToInt(this.rabbit.object.position.z),

        lookX: this.floatToInt(this.rabbit.lookX),
        lookY: this.floatToInt(this.rabbit.lookY),
        lookZ: this.floatToInt(this.rabbit.lookZ),

        isDuck: this.rabbit.isDuck
    };

    // Main Player ID
    this.rabbitID = "";

    // List of Rabbits here!
    this.rabbits = {};

    // Rabbits Animation Helper
    this.rabbitsAnimationHelper = {}
    this.rabbitsUpdateTo = {}

    // WS Connection
    this.wsConn;
    this.url;
    this.urlRedirect;

    // Chat
    this.chat = "";
    this.chatTimer = new Clock();
    this.chatFirstTime = true;

    // Clock for Animation Purpose
    this.clockMessage = new Clock();
    this.deltaMessage = parseFloat(0);
    this.deltaElapsed = parseFloat(0);
    this.deltaAnimation = parseFloat(0);
    this.isAnimating = false;

    this.connect = function(url) {
        if(typeof url !== 'undefined' && url != "") {
            this.url = url + "/channel/join";
        }

        var connectURL = this.url;

        if(typeof this.urlRedirect !== 'undefined' && this.urlRedirect != "") {
            connectURL = this.urlRedirect;
            this.urlRedirect = undefined;
        }

        this.wsConn = new WebSocket(connectURL);
        this.bindEvents();
    };

    this.disconnect = function() {
        this.wsConn.close();
    };

    this.bindEvents = function() {
        var wsHandler = this;

        // Remove all Rabbit on connection close!
        this.wsConn.onclose = function (evt) {
            wsHandler.connected = false;
            wsHandler.clear();

            if(typeof wsHandler.urlRedirect !== 'undefined' && wsHandler.urlRedirect != "") {
                wsHandler.connect();
                return
            }

            if(wsHandler.disconnectedReason == "") {
                wsHandler.disconnectedReason = "Timed out";
            }

            if(typeof wsHandler.disconnectHandler !== 'undefined') {
                wsHandler.disconnectHandler();
            }
        };

        this.wsConn.onopen = function (evt) {
            wsHandler.clear();
        };

        this.wsConn.onmessage = function (evt) {
            wsHandler.parseServerMessage(evt.data);
            wsHandler.sendUpdate();
        };
    };

    // Sanitize Chat
    this.chatSanitized = function(chat) {
        if(typeof chat === 'undefined') {
            return this.chat.trim().slice(0, 50);
        } else {
            return chat.trim().slice(0, 50);
        }
    };

    // Get Disconnect Reason
    this.getDisconnectedReason = function() {
        var reason = this.disconnectedReason;

        if(reason != "") {
            this.disconnectedReason = "";
        }

        return reason;
    };

    this.sendChat = function(chat) {
        // If error, this time is saved so timer is not resetted back to 0
        var chatTimeOld = this.chatTimer.oldTime;

        var chatTimeDelta = this.chatTimer.getDelta();

        if ( chatTimeDelta > 3 || this.chatFirstTime ) {

            var chatClean = this.chatSanitized(chat);

            this.chatFirstTime = false;
            this.chat = chatClean;

            // Do not print command on rabbit
            if(chat.charAt(0) != '/') {
                if(typeof this.chatFilter !== 'undefined') {
                    chatClean = this.chatFilter.filter(chatClean);
                }

                this.rabbit.setChat(chatClean);
            }

            return "";

        } else {

            this.chatTimer.oldTime = chatTimeOld; // set back so not reseting counter

            return (3 - chatTimeDelta);

        }
    }

    // Send first data
    this.sendInit = function() {
        var rabbitLookAt = this.rabbit.currentLookAt();

        var rabbitData = [
            "0", // Send Code 0 for init
            this.rabbit.colorH,
            this.rabbit.colorS,
            this.rabbit.colorL,
            this.floatToInt(this.rabbit.object.position.x),
            this.floatToInt(this.rabbit.object.position.y),
            this.floatToInt(this.rabbit.object.position.z),
            this.floatToInt(rabbitLookAt.x),
            this.floatToInt(rabbitLookAt.y),
            this.floatToInt(rabbitLookAt.z),
            (this.rabbit.isDuck) ? 1 : 0
        ];

        this.wsConn.send(rabbitData.join(','));

        // Set Delta
        this.deltaMessage = this.clockMessage.getDelta();
    }

    this.sendUpdate = function() {
        var isChanged = false;
        var rabbitData = [ "1" ]; // Send Code 1 for update

        // Position
        var currX = this.floatToInt(this.rabbit.object.position.x);
        if(currX != this.rabbitPast.x) {
            rabbitData.push(currX);
            this.rabbitPast.x = currX;
            isChanged = true;
        } else {
            rabbitData.push("");
        }

        var currY = this.floatToInt(this.rabbit.object.position.y);
        if(currY != this.rabbitPast.y) {
            rabbitData.push(currY);
            this.rabbitPast.y = currY;
            isChanged = true;
        } else {
            rabbitData.push("");
        }

        var currZ = this.floatToInt(this.rabbit.object.position.z);
        if(currZ != this.rabbitPast.z) {
            rabbitData.push(currZ);
            this.rabbitPast.z = currZ;
            isChanged = true;
        } else {
            rabbitData.push("");
        }

        // Look At
        var rabbitLookAt = this.rabbit.currentLookAt();

        var currLookX = this.floatToInt(rabbitLookAt.x);
        if(currLookX != this.rabbitPast.lookX) {
            rabbitData.push(currLookX);
            this.rabbitPast.lookX = currLookX;
            isChanged = true;
        } else {
            rabbitData.push("");
        }

        var currLookY = this.floatToInt(rabbitLookAt.y);
        if(currLookY != this.rabbitPast.lookY) {
            rabbitData.push(currLookY);
            this.rabbitPast.lookY = currLookY;
            isChanged = true;
        } else {
            rabbitData.push("");
        }

        var currLookZ = this.floatToInt(rabbitLookAt.z);
        if(currLookZ != this.rabbitPast.lookZ) {
            rabbitData.push(currLookZ);
            this.rabbitPast.lookZ = currLookZ;
            isChanged = true;
        } else {
            rabbitData.push("");
        }

        if(this.rabbit.isDuck != this.rabbitPast.isDuck) {
            var parseIsDuck = (this.rabbit.isDuck) ? '1' : '0';
            rabbitData.push(parseIsDuck);
            this.rabbitPast.isDuck = this.rabbit.isDuck;
            isChanged = true;
        } else {
            rabbitData.push("");
        }

        rabbitData.push(this.chat);
        if(this.chat != "") {
            this.chat = "";
            isChanged = true;
        }

        if(isChanged) {
            this.wsConn.send(rabbitData.join(','));
        }
    };


    this.sendPing = function() {
        this.wsConn.send('P');
    }

    this.parseMessageSplitter = function(str, sep, n) {
        var parts = str.split(sep);

        if(typeof n === 'undefined' || parts.length <= n) {
            return parts;
        }

        return parts.slice(0, n-1).concat([parts.slice(n-1).join(sep)]);
    }

    this.parseServerMessage = function (messages) {
        // Just send ping here
        if(messages == "P") {
            this.sendPing();
            return;
        }

        var messagePerLine = messages.split('\n');

        for (var i = 0; i < messagePerLine.length; i++) {
            var message = messagePerLine[i];

            if(message == "") {
                continue;
            }

            var messageSplit = message.split(",");

            if(messageSplit.length >= 1) {
                var messageID = messageSplit[0];

                switch(messageID) {
                    case "0":
                        var messageSplitFormat = this.parseMessageSplitter(message, ",", 2);
                        if(messageSplitFormat.length != 2) {
                            break;
                        }

                        this.rabbitID = messageSplitFormat[1];
                        this.connected = true;
                        this.sendInit();
                        break;
                    case "1":
                        var messageSplitFormat = this.parseMessageSplitter(message, ",", 12);
                        if(messageSplitFormat.length != 12) {
                            break;
                        }

                        var rabbitData = {
                            id: messageSplitFormat[1],

                            // Colors
                            r: messageSplitFormat[2],
                            g: messageSplitFormat[3],
                            b: messageSplitFormat[4],

                            // Position
                            x: messageSplitFormat[5],
                            y: messageSplitFormat[6],
                            z: messageSplitFormat[7],

                            // Look At
                            lookX: messageSplitFormat[8],
                            lookY: messageSplitFormat[9],
                            lookZ: messageSplitFormat[10],

                            isDuck: (messageSplitFormat[11] == '1') ? true : false
                        };

                        this.addRabbit(rabbitData);

                        break;
                    case "2":
                        var messageSplitFormat = this.parseMessageSplitter(message, ",", 10);
                        if(messageSplitFormat.length != 10) {
                            break;
                        }

                        var rabbitData = {
                            id: messageSplitFormat[1],

                            // Position
                            x: messageSplitFormat[2],
                            y: messageSplitFormat[3],
                            z: messageSplitFormat[4],

                            // Look At
                            lookX: messageSplitFormat[5],
                            lookY: messageSplitFormat[6],
                            lookZ: messageSplitFormat[7],

                            isDuck: messageSplitFormat[8],

                            chat: messageSplitFormat[9]
                        };

                        this.updateRabbit(rabbitData);

                        break;
                    case "3":
                        var messageSplitFormat = this.parseMessageSplitter(message, ",", 2);
                        if(messageSplitFormat.length != 2) {
                            break;
                        }

                        this.removeRabbit(messageSplitFormat[1]);
                        break;
                    case "9":
                        var messageSplitFormat = this.parseMessageSplitter(message, ",", 2);
                        if(messageSplitFormat.length != 2) {
                            break;
                        }

                        this.disconnectedReason = messageSplitFormat[1];
                        break;
                    case "R":
                        var messageSplitFormat = this.parseMessageSplitter(message, ",", 2);
                        if(messageSplitFormat.length != 2) {
                            break;
                        }

                        this.urlRedirect = messageSplitFormat[1];
                        break;
                    case "S":
                        var messageSplitFormat = this.parseMessageSplitter(message, ",");

                        if(messageSplitFormat.length < 2) {
                            break;
                        }

                        if(messageSplitFormat[1] == "F") {
                            if(messageSplitFormat.length < 5) {
                                break;
                            }

                            var time = messageSplitFormat[2];
                            if(time < 100) {
                                time = 100;
                            }

                            var timeTransition = messageSplitFormat[3];
                            if (timeTransition > (time - 50)) {
                                timeTransition = (time - 50);
                            }

                            var colors = messageSplitFormat.slice(4);

                            if(colors.length > 1) {
                                var that = this;
                                clearInterval(this.backgroundTimeout);
                                this.backgroundTimeout = setTimeout(function() { that.backgroundFlash(time, timeTransition, colors, 0) }, time);
                            }
                        } else {
                            if(messageSplitFormat.length != 2) {
                                break;
                            }

                            if(typeof this.backgroundDom !== 'undefined') {
                                if(typeof this.backgroundTimeout !== 'undefined') {
                                    clearInterval(this.backgroundTimeout);
                                    this.backgroundTimeout = undefined;
                                }

                                var changeColor = messageSplitFormat[1];
                                if(changeColor == "default") {
                                    changeColor = "#4857b5";
                                }

                                this.backgroundDom.style.backgroundColor = changeColor;
                                this.backgroundDom.style.transition = "background-color 2s ease-in-out";
                            }
                        }

                        break;
                }
            }
        }

        // Set delta every message get
        this.deltaMessage = this.clockMessage.getDelta();
    };

    // Add Rabbit
    this.addRabbit = function(rabbitData) {
        if (rabbitData.id == this.rabbitID) {
            return;
        }

        this.rabbits[rabbitData.id] = new Rabbit(rabbitData.r, rabbitData.g, rabbitData.b);
        this.rabbits[rabbitData.id].move(rabbitData.x, rabbitData.y, rabbitData.z);
        this.rabbits[rabbitData.id].lookAt(rabbitData.lookX, rabbitData.lookY, rabbitData.lookZ);
        this.rabbits[rabbitData.id].duck(rabbitData.isDuck);

        this.floor.addRabbit(this.rabbits[rabbitData.id], rabbitData.x, rabbitData.y, rabbitData.z);

        this.rabbitsUpdateTo[rabbitData.id] = {
            changed: false,

            x: rabbitData.x,
            y: rabbitData.y,
            z: rabbitData.z,

            lookX: rabbitData.lookX,
            lookY: rabbitData.lookY,
            lookZ: rabbitData.lookZ,
        };

        this.rabbitsAnimationHelper[rabbitData.id] = {
            changed: false,

            x: rabbitData.x,
            y: rabbitData.y,
            z: rabbitData.z,

            toX: rabbitData.x,
            toY: rabbitData.y,
            toZ: rabbitData.z,

            lookX: rabbitData.lookX,
            lookY: rabbitData.lookY,
            lookZ: rabbitData.lookZ,

            toLookX: rabbitData.lookX,
            toLookY: rabbitData.lookY,
            toLookZ: rabbitData.lookZ
        };
    };

    // Update Rabbit
    this.updateRabbit = function(rabbitData) {
        if(rabbitData.id == this.rabbitID) {
            return;
        }

        var isChanged = false;

        if(rabbitData.x != "" && rabbitData.x != this.rabbitsUpdateTo[rabbitData.id].x) {
            this.rabbitsUpdateTo[rabbitData.id].x = rabbitData.x;
            isChanged = true;
        }

        if(rabbitData.y != "" && rabbitData.y != this.rabbitsUpdateTo[rabbitData.id].y) {
            this.rabbitsUpdateTo[rabbitData.id].y = rabbitData.y;
            isChanged = true;
        }

        if(rabbitData.z != "" && rabbitData.z!= this.rabbitsUpdateTo[rabbitData.id].z) {
            this.rabbitsUpdateTo[rabbitData.id].z = rabbitData.z;
            isChanged = true;
        }

        if(rabbitData.lookX != "" && rabbitData.lookX != this.rabbitsUpdateTo[rabbitData.id].lookX) {
            this.rabbitsUpdateTo[rabbitData.id].lookX = rabbitData.lookX;
            isChanged = true;
        }

        if(rabbitData.lookY != "" && rabbitData.lookY != this.rabbitsUpdateTo[rabbitData.id].lookY) {
            this.rabbitsUpdateTo[rabbitData.id].lookY = rabbitData.lookY;
            isChanged = true;
        }

        if(rabbitData.lookZ != "" && rabbitData.lookZ != this.rabbitsUpdateTo[rabbitData.id].lookZ) {
            this.rabbitsUpdateTo[rabbitData.id].lookZ = rabbitData.lookZ;
            isChanged = true;
        }

        this.rabbitsUpdateTo[rabbitData.id].changed = isChanged;

        // We need to update the data due to bug, but instead of pass it to the animation, we do it here and not animating anything
        // This is actually a hack but whatever
        if(!this.animation) {
            this.rabbits[rabbitData.id].move(this.rabbitsUpdateTo[rabbitData.id].x, this.rabbitsUpdateTo[rabbitData.id].y, this.rabbitsUpdateTo[rabbitData.id].z);
            this.rabbits[rabbitData.id].lookAt(this.rabbitsUpdateTo[rabbitData.id].lookX, this.rabbitsUpdateTo[rabbitData.id].lookY, this.rabbitsUpdateTo[rabbitData.id].lookZ);

            // this one is out of nowhere right?
            this.rabbitsAnimationHelper[rabbitData.id].x = this.rabbitsUpdateTo[rabbitData.id].x;
            this.rabbitsAnimationHelper[rabbitData.id].y = this.rabbitsUpdateTo[rabbitData.id].y;
            this.rabbitsAnimationHelper[rabbitData.id].z = this.rabbitsUpdateTo[rabbitData.id].z;
            this.rabbitsAnimationHelper[rabbitData.id].lookX = this.rabbitsUpdateTo[rabbitData.id].lookX;
            this.rabbitsAnimationHelper[rabbitData.id].lookY = this.rabbitsUpdateTo[rabbitData.id].lookY;
            this.rabbitsAnimationHelper[rabbitData.id].lookZ = this.rabbitsUpdateTo[rabbitData.id].lookZ;

            this.rabbitsAnimationHelper[rabbitData.id].toX = this.rabbitsUpdateTo[rabbitData.id].x;
            this.rabbitsAnimationHelper[rabbitData.id].toY = this.rabbitsUpdateTo[rabbitData.id].y;
            this.rabbitsAnimationHelper[rabbitData.id].toZ = this.rabbitsUpdateTo[rabbitData.id].z;
            this.rabbitsAnimationHelper[rabbitData.id].toLookX = this.rabbitsUpdateTo[rabbitData.id].lookX;
            this.rabbitsAnimationHelper[rabbitData.id].toLookY = this.rabbitsUpdateTo[rabbitData.id].lookY;
            this.rabbitsAnimationHelper[rabbitData.id].toLookZ = this.rabbitsUpdateTo[rabbitData.id].lookZ;
        }

        // We do not need animate loop for duck and chat

        if(rabbitData.isDuck != "") {
            var parseDuck = (rabbitData.isDuck == '1') ? true : false;
            this.rabbits[rabbitData.id].duck(parseDuck);
        }

        if(this.chatEnabled && rabbitData.chat != "") {

            if(typeof this.chatFilter !== 'undefined') {
                rabbitData.chat = this.chatFilter.filter(rabbitData.chat);
            }

            this.rabbits[rabbitData.id].setChat(rabbitData.chat);

            rabbitData.chat = "";
        }
    };

    // Remove Rabbit
    this.removeRabbit = function(id) {
        if(id == this.rabbitID) {
            return;
        }

        if (this.rabbits[id] !== undefined) {
            this.floor.removeRabbit(this.rabbits[id]);
            this.rabbits[id].dispose();
        }

        delete this.rabbits[id];
        delete this.rabbitsAnimationHelper[id];
        delete this.rabbitsUpdateTo[id];
    };

    this.clear = function() {
        for (const key of Object.keys(this.rabbits)) {
            this.removeRabbit(key);
        }

        this.rabbitID = "";
    }

    // Update Animation
    // This thing is hard lmao, i gave up.
    // There are still some bugs, especially rubberbanding and frame skipping
    // but I don't care anymore lmao
    this.updateAnimation = function(delta) {
        if(!this.animation) {
            this.deltaElapsed = this.deltaMessage;
            this.isAnimating = false;
            return;
        }

        var animateFirstFrame = false;

        if(!this.isAnimating) {

            if(this.deltaElapsed > this.deltaMessage) {
                this.deltaAnimation = this.deltaMessage - (this.deltaElapsed - this.deltaMessage);
            } else {
                this.deltaAnimation = this.deltaMessage;
            }

            this.deltaElapsed = 0;
            this.isAnimating = true;
            animateFirstFrame = true;

            // Hacks
            if(this.deltaAnimation <= 0) {
                this.deltaElapsed = 0.01;
                this.deltaAnimation = 0.01;
            }

        }

        if(this.deltaMessage > 0 && this.deltaElapsed <= this.deltaAnimation) {

            this.deltaElapsed += delta;
            var percentProgress = this.deltaElapsed / this.deltaAnimation;

            if(percentProgress >= 1) {

                this.isAnimating = false;

            }

            for (const id of Object.keys(this.rabbitsUpdateTo)) {

                if(id == this.rabbitID) {

                    continue;

                }

                if(animateFirstFrame && this.rabbitsUpdateTo[id].changed) {
                    // Set the old first
                    this.rabbitsAnimationHelper[id].x = this.rabbitsAnimationHelper[id].toX;
                    this.rabbitsAnimationHelper[id].y = this.rabbitsAnimationHelper[id].toY;
                    this.rabbitsAnimationHelper[id].z = this.rabbitsAnimationHelper[id].toZ;
                    this.rabbitsAnimationHelper[id].lookX = this.rabbitsAnimationHelper[id].toLookX;
                    this.rabbitsAnimationHelper[id].lookY = this.rabbitsAnimationHelper[id].toLookY;
                    this.rabbitsAnimationHelper[id].lookZ = this.rabbitsAnimationHelper[id].toLookZ;

                    // set new
                    this.rabbitsAnimationHelper[id].toX = this.rabbitsUpdateTo[id].x;
                    this.rabbitsAnimationHelper[id].toY = this.rabbitsUpdateTo[id].y;
                    this.rabbitsAnimationHelper[id].toZ = this.rabbitsUpdateTo[id].z;
                    this.rabbitsAnimationHelper[id].toLookX = this.rabbitsUpdateTo[id].lookX;
                    this.rabbitsAnimationHelper[id].toLookY = this.rabbitsUpdateTo[id].lookY;
                    this.rabbitsAnimationHelper[id].toLookZ = this.rabbitsUpdateTo[id].lookZ;

                    // update
                    this.rabbitsAnimationHelper[id].changed = true;
                }

                if(this.rabbitsAnimationHelper[id].changed) {

                    if(percentProgress < 1) {

                        // Move
                        var diffPercentX = (this.rabbitsAnimationHelper[id].toX - this.rabbitsAnimationHelper[id].x) * percentProgress;
                        var diffPercentY = (this.rabbitsAnimationHelper[id].toY - this.rabbitsAnimationHelper[id].y) * percentProgress;
                        var diffPercentZ = (this.rabbitsAnimationHelper[id].toZ - this.rabbitsAnimationHelper[id].z) * percentProgress;
                        var posX = parseFloat(this.rabbitsAnimationHelper[id].x) + diffPercentX;
                        var posY = parseFloat(this.rabbitsAnimationHelper[id].y) + diffPercentY;
                        var posZ = parseFloat(this.rabbitsAnimationHelper[id].z) + diffPercentZ;

                        this.rabbits[id].move(posX, posY, posZ);

                        // Rotate / Look at
                        var diffLookPercentX = (this.rabbitsAnimationHelper[id].toLookX - this.rabbitsAnimationHelper[id].lookX) * percentProgress;
                        var diffLookPercentY = (this.rabbitsAnimationHelper[id].toLookY - this.rabbitsAnimationHelper[id].lookY) * percentProgress;
                        var diffLookPercentZ = (this.rabbitsAnimationHelper[id].toLookZ - this.rabbitsAnimationHelper[id].lookZ) * percentProgress;
                        var lookX = parseFloat(this.rabbitsAnimationHelper[id].lookX) + diffLookPercentX;
                        var lookY = parseFloat(this.rabbitsAnimationHelper[id].lookY) + diffLookPercentY;
                        var lookZ = parseFloat(this.rabbitsAnimationHelper[id].lookZ) + diffLookPercentZ;

                        this.rabbits[id].lookAt(lookX, lookY, lookZ);

                    } else {

                        this.rabbits[id].move(this.rabbitsAnimationHelper[id].toX, this.rabbitsAnimationHelper[id].toY, this.rabbitsAnimationHelper[id].toZ);
                        this.rabbits[id].lookAt(this.rabbitsAnimationHelper[id].toLookX, this.rabbitsAnimationHelper[id].toLookY, this.rabbitsAnimationHelper[id].toLookZ);

                        this.rabbitsAnimationHelper[id].changed = false;

                    }

                }
            }
        }
    };

    // Background Stuff
    this.setBackgroundDom = function(dom) {
        if(typeof dom === 'undefined') {
            return;
        }

        this.backgroundDom = dom;
    }

    this.backgroundFlash = function(time, timeTransition, colors, num) {
        if(typeof this.backgroundDom !== 'undefined') {
            if(typeof this.backgroundTimeout === 'undefined') {
                return;
            }

            if(num == 0) {
                this.backgroundDom.style.transition = "background-color " + timeTransition + "ms ease";
            }

            if(num >= colors.length) {
                num = 0;
            }

            var changeColor = colors[num];
            if(changeColor == "default") {
                changeColor = "#4857b5";
            }

            this.backgroundDom.style.backgroundColor = changeColor;

            num++;

            var that = this;

            this.backgroundTimeout = setTimeout(function() { that.backgroundFlash(time, timeTransition, colors, num) }, time);
        }
    };

    // Animation enable disable
    this.disableAnimation = function(){
        this.animation = false;
    };

    this.enableAnimation = function(){
        this.animation = true;
    };

    // Chat Disable Enable
    this.disableChat = function(){
        this.chatEnabled = false;
    };

    this.enableChat = function(){
        this.chatEnabled = true;
    };

};

export { WebSocketHandler };