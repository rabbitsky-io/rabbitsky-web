import {
    Clock
} from "../three.module.js";

import {
    Rabbit
} from "./Rabbit.js";

var WebSocketHandler = function(rabbit, floor, stage) {

    this.rabbit = rabbit;
    this.floor = floor;
    this.stage = stage;

    // For changing background color ingame
    this.backgroundDom;
    this.backgroundFlashInterval;

    this.animation = true;
    this.chatEnabled = true;

    this.chatFilter;

    this.disconnectHandler;

    this.connected = false;
    this.disconnectedReason = "";
    this.disconnectByUser = false;

    this.exFuncEnableAdminPanel;

    // We don't really need float tho
    this.floatToInt = function(float) {
        return Math.round(float);
    }

    // Main Rabbit Past Information for Sending Messages
    this.rabbitPast = {
        size: this.rabbit.size,

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

    // Regex for parse message
    this.regexParseRabbit = new RegExp('^(?<id>[^=]+)=(B(?<size>[1-9]))?(H(?<colorh>[0-9]{1,3}))?(S(?<colors>[0-9]{1,3}))?(L(?<colorl>[0-9]{1,3}))?(X(?<posx>\-?[0-9]+))?(Y(?<posy>\-?[0-9]+))?(Z(?<posz>\-?[0-9]+))?(x(?<lookx>\-?[0-9]+))?(y(?<looky>\-?[0-9]+))?(z(?<lookz>\-?[0-9]+))?(D(?<duck>(0|1)))?(C(?<chat>.*))?$');

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

    this.disconnect = function(isUser) {
        if(typeof isUser !== 'undefined' && isUser){
            this.disconnectByUser = true;
        }

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

            if(this.disconnectByUser) {
                wsHandler.disconnectedReason = "BYUSER";
                this.disconnectByUser = false;
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

        if ( chatTimeDelta > 3 || this.chatFirstTime || this.rabbit.isAdmin ) {

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
            "H",
            this.rabbit.colorH,
            "S",
            this.rabbit.colorS,
            "L",
            this.rabbit.colorL,
            "X",
            this.floatToInt(this.rabbit.object.position.x),
            "Y",
            this.floatToInt(this.rabbit.object.position.y),
            "Z",
            this.floatToInt(this.rabbit.object.position.z),
            "x",
            this.floatToInt(rabbitLookAt.x),
            "y",
            this.floatToInt(rabbitLookAt.y),
            "z",
            this.floatToInt(rabbitLookAt.z),
            "D",
            (this.rabbit.isDuck) ? 1 : 0
        ];

        this.wsConn.send(rabbitData.join(''));

        // Set Delta
        this.deltaMessage = this.clockMessage.getDelta();
    }

    this.sendUpdate = function() {
        var rabbitData = [ "1" ]; // Send Code 1 for update

        // Position
        var currX = this.floatToInt(this.rabbit.object.position.x);
        if(currX != this.rabbitPast.x) {
            rabbitData.push("X");
            rabbitData.push(currX);
        }

        var currY = this.floatToInt(this.rabbit.object.position.y);
        if(currY != this.rabbitPast.y) {
            rabbitData.push("Y");
            rabbitData.push(currY);
        }

        var currZ = this.floatToInt(this.rabbit.object.position.z);
        if(currZ != this.rabbitPast.z) {
            rabbitData.push("Z");
            rabbitData.push(currZ);
        }

        // Look At
        var rabbitLookAt = this.rabbit.currentLookAt();

        var currLookX = this.floatToInt(rabbitLookAt.x);
        if(currLookX != this.rabbitPast.lookX) {
            rabbitData.push("x");
            rabbitData.push(currLookX);
        }

        var currLookY = this.floatToInt(rabbitLookAt.y);
        if(currLookY != this.rabbitPast.lookY) {
            rabbitData.push("y");
            rabbitData.push(currLookY);
        }

        var currLookZ = this.floatToInt(rabbitLookAt.z);
        if(currLookZ != this.rabbitPast.lookZ) {
            rabbitData.push("z");
            rabbitData.push(currLookZ);
        }

        if(this.rabbit.isDuck != this.rabbitPast.isDuck) {
            var parseIsDuck = (this.rabbit.isDuck) ? '1' : '0';
            rabbitData.push("D");
            rabbitData.push(parseIsDuck);
        }

        if(this.chat != "") {
            rabbitData.push("C");
            rabbitData.push(this.chat);
            this.chat = "";
        }

        if(rabbitData.length > 1) {
            this.wsConn.send(rabbitData.join(''));
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

            var messageID = message.charAt(0);

            switch(messageID) {
                case "0":
                    var messageData = message.substr(1);
                    if (messageData == "") {
                        break;
                    }

                    this.rabbitID = messageData;
                    this.connected = true;
                    this.sendInit();
                    break;
                case "1":
                    var messageData = message.substr(1);
                    if (messageData == "") {
                        break;
                    }

                    var regexGroup = messageData.match(this.regexParseRabbit).groups;
                    if(typeof regexGroup.id === undefined) {
                        break;
                    }

                    var rabbitData = {
                        id: regexGroup.id,

                        // Size
                        size: (regexGroup.size) ? regexGroup.size : '',

                        // Colors
                        h: (regexGroup.colorh) ? regexGroup.colorh : '',
                        s: (regexGroup.colors) ? regexGroup.colors : '',
                        l: (regexGroup.colorl) ? regexGroup.colorl : '',

                        // Position
                        x: (regexGroup.posx) ? regexGroup.posx : '',
                        y: (regexGroup.posy) ? regexGroup.posy : '',
                        z: (regexGroup.posz) ? regexGroup.posz : '',

                        // Look At
                        lookX: (regexGroup.lookx) ? regexGroup.lookx : '',
                        lookY: (regexGroup.looky) ? regexGroup.looky : '',
                        lookZ: (regexGroup.lookz) ? regexGroup.lookz : '',

                        isDuck: (regexGroup.duck && regexGroup.duck == '1') ? true : false
                    };

                    this.addRabbit(rabbitData);

                    break;
                case "2":
                    var messageData = message.substr(1);
                    if (messageData == "") {
                        break;
                    }

                    var regexGroup = messageData.match(this.regexParseRabbit).groups;
                    if(typeof regexGroup.id === undefined) {
                        break;
                    }

                    var rabbitData = {
                        id: regexGroup.id,

                        // Size
                        size: (regexGroup.size) ? regexGroup.size : '',

                        // Colors
                        h: (regexGroup.colorh) ? regexGroup.colorh : '',
                        s: (regexGroup.colors) ? regexGroup.colors : '',
                        l: (regexGroup.colorl) ? regexGroup.colorl : '',

                        // Position
                        x: (regexGroup.posx) ? regexGroup.posx : '',
                        y: (regexGroup.posy) ? regexGroup.posy : '',
                        z: (regexGroup.posz) ? regexGroup.posz : '',

                        // Look At
                        lookX: (regexGroup.lookx) ? regexGroup.lookx : '',
                        lookY: (regexGroup.looky) ? regexGroup.looky : '',
                        lookZ: (regexGroup.lookz) ? regexGroup.lookz : '',

                        isDuck: (regexGroup.duck) ? regexGroup.duck : '',

                        chat: (regexGroup.chat) ? regexGroup.chat : ''
                    };

                    this.updateRabbit(rabbitData);

                    break;
                case "3":
                    var messageData = message.substr(1);
                    if (messageData == "") {
                        break;
                    }

                    this.removeRabbit(messageData);
                    break;
                case "9":
                    var messageData = message.substr(1);
                    if (messageData == "") {
                        break;
                    }

                    if (messageData == "PAGERELOAD") {
                        location.reload();
                        break;
                    }

                    this.disconnectedReason = messageData;
                    break;
                case "R":
                    var messageData = message.substr(1);
                    if (messageData == "") {
                        break;
                    }

                    this.urlRedirect = messageData;
                    break;
                case "F":
                    var messageData = message.substr(1);
                    if (messageData == "") {
                        break;
                    }

                    if (messageData == "1") {
                        this.rabbit.canFly = true;
                    } else {
                        this.rabbit.canFly = false;
                    }

                    break;
                case "S":
                    var messageData = message.substr(1);
                    if (messageData == "") {
                        break;
                    }

                    var skyType = messageData.charAt(0);
                    if (skyType == "F") {
                        var skyData = messageData.substr(1);
                        if(skyData == "") {
                            break;
                        }

                        var splitSkyData = this.parseMessageSplitter(skyData, ",");
                        if(splitSkyData.length < 3) {
                            break;
                        }

                        var time = splitSkyData[0];
                        if(time < 100) {
                            time = 100;
                        }

                        var timeTransition = splitSkyData[1];
                        if (timeTransition > (time - 50)) {
                            timeTransition = (time - 50);
                        }

                        var colors = splitSkyData.slice(2);

                        if(colors.length > 1) {
                            var that = this;
                            clearInterval(this.backgroundTimeout);
                            this.backgroundTimeout = setTimeout(function() { that.backgroundFlash(time, timeTransition, colors, 0) }, 1);
                        }
                    } else {
                        var skyData = messageData.substr(1);
                        if(skyData == "") {
                            break;
                        }

                        if(typeof this.backgroundDom !== 'undefined') {
                            if(typeof this.backgroundTimeout !== 'undefined') {
                                clearInterval(this.backgroundTimeout);
                                this.backgroundTimeout = undefined;
                            }

                            var changeColor = skyData;
                            if(changeColor == "default") {
                                changeColor = "#4857b5";
                            }

                            this.backgroundDom.style.backgroundColor = changeColor;
                            this.backgroundDom.style.transition = "background-color 2s ease-in-out";
                        }
                    }

                    break;
                case "L":
                    var messageData = message.substr(1);
                    if (messageData == "") {
                        break;
                    }

                    var lightType = messageData.charAt(0);
                    if (lightType == "0") {

                        this.stage.lightAlwaysOff();

                    } else if (lightType == "1") {

                        if(messageData.length > 1) {
                            var lightColor = messageData.substr(1);
                            if(lightColor == "default") {
                                lightColor = "#4857b5";
                            }

                            this.stage.lightColor(lightColor);
                        }

                        this.stage.lightAlwaysOn();

                    } else if (lightType == "2") {

                        var lightData = messageData.substr(1);
                        if(lightData == "") {
                            break;
                        }

                        var splitLightData = this.parseMessageSplitter(lightData, ",");
                        if(splitLightData.length < 2) {
                            break;
                        }

                        var time = splitLightData[0];
                        if(time < 100) {
                            time = 100;
                        }

                        var timeTransition = splitLightData[1];
                        if (timeTransition > (time - 50)) {
                            timeTransition = (time - 50);
                        }

                        if(splitLightData.length > 2) {
                            var lightColor = splitLightData[2];
                            if(lightColor == "default") {
                                lightColor = "#4857b5";
                            }

                            this.stage.lightColor(lightColor);
                        }

                        this.stage.lightBlink(time, timeTransition);
                    }

                    break;

                case "A":
                    this.rabbit.isAdmin = true;
                    if(typeof this.exFuncEnableAdminPanel !== "undefined") {
                        this.exFuncEnableAdminPanel();
                    }

                    break;
            }
        }

        // Set delta every message get
        this.deltaMessage = this.clockMessage.getDelta();
    };

    // Add Rabbit
    this.addRabbit = function(rabbitData) {
        if (rabbitData.id == this.rabbitID) {
            this.rabbitPast = {
                x: rabbitData.x != "" ? rabbitData.x : this.rabbitPast.x,
                y: rabbitData.y != "" ? rabbitData.y : this.rabbitPast.y,
                z: rabbitData.z != "" ? rabbitData.z : this.rabbitPast.z,

                lookX: rabbitData.lookX != "" ? rabbitData.lookX : this.rabbitPast.lookX,
                lookY: rabbitData.lookY != "" ? rabbitData.lookY : this.rabbitPast.lookY,
                lookZ: rabbitData.lookZ != "" ? rabbitData.lookZ : this.rabbitPast.lookZ,

                isDuck: rabbitData.isDuck != "" ? rabbitData.isDuck : this.rabbitPast.isDuck
            };

            if(rabbitData.size != "") {
                this.rabbit.setSize(rabbitData.size);
            }

            return;
        }

        this.rabbits[rabbitData.id] = new Rabbit(rabbitData.h, rabbitData.s, rabbitData.l);
        this.rabbits[rabbitData.id].move(rabbitData.x, rabbitData.y, rabbitData.z);
        this.rabbits[rabbitData.id].lookAt(rabbitData.lookX, rabbitData.lookY, rabbitData.lookZ);
        this.rabbits[rabbitData.id].duck(rabbitData.isDuck);

        if(rabbitData.size != "") {
            this.rabbits[rabbitData.id].setSize(rabbitData.size);
        }

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
            this.rabbitPast = {
                x: rabbitData.x != "" ? rabbitData.x : this.rabbitPast.x,
                y: rabbitData.y != "" ? rabbitData.y : this.rabbitPast.y,
                z: rabbitData.z != "" ? rabbitData.z : this.rabbitPast.z,

                lookX: rabbitData.lookX != "" ? rabbitData.lookX : this.rabbitPast.lookX,
                lookY: rabbitData.lookY != "" ? rabbitData.lookY : this.rabbitPast.lookY,
                lookZ: rabbitData.lookZ != "" ? rabbitData.lookZ : this.rabbitPast.lookZ,

                isDuck: rabbitData.isDuck != "" ? rabbitData.isDuck : this.rabbitPast.isDuck
            };

            if(rabbitData.size != "") {
                this.rabbit.setSize(rabbitData.size);
            }

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

        // We do not need animate loop for duck, size and chat

        if(rabbitData.size != "" && rabbitData.size > 0 && rabbitData.size < 10) {
            this.rabbits[rabbitData.id].setSize(rabbitData.size);
        }

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
                    this.rabbitsUpdateTo[id].changed = false;
                    this.rabbitsAnimationHelper[id].changed = true;
                }

                if(this.rabbitsAnimationHelper[id].changed) {

                    if(percentProgress < 1 && (animateFirstFrame || this.rabbits[id].object.visibleCamera)) {
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