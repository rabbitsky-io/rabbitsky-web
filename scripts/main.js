import { Font } from "./modules/font.js"
import { FgEmojiPicker } from "./modules/emoji/fgEmojiPicker.js"
import { Config } from "./modules/config.js"
import { ChatFilter } from "./modules/chatfilter.js"
import { RabbitCustomizer } from "./modules/rabbitCustomizer.js"
import { RabbitSky } from "./modules/rabbitsky.js"

var font = new Font();
var config = new Config();
var chatFilter = new ChatFilter();
var emojiPicker = new FgEmojiPicker({
    trigger: '#chat-emoji',
    dir: "./extras/",
    position: ['top', 'left'],
    emit(obj, triggerElement) {
        if(document.getElementById('chat-input').value == "") {
            rabbitSky.sendChat(obj.emoji);
            rabbitSky.focus();
        } else {
            document.getElementById('chat-input').value += obj.emoji;
            document.getElementById('chat-input').focus();
        }
    }
});

var rabbitCustomizer = new RabbitCustomizer(document.getElementById("rabbit-customizer-canvas"));
document.getElementById("rabbit-color-hue").value = rabbitCustomizer.rabbit.colorH;
document.getElementById("rabbit-color-saturation").value = rabbitCustomizer.rabbit.colorS;
document.getElementById("rabbit-color-lightness").value = rabbitCustomizer.rabbit.colorL;
document.getElementById("rabbit-color-saturation").style.background = "linear-gradient(90deg, hsl(" + rabbitCustomizer.rabbit.colorH + ",0%,50%) 0%, hsl(" + rabbitCustomizer.rabbit.colorH + ",100%,50%) 100%)"
document.getElementById("rabbit-color-lightness").style.background = "linear-gradient(90deg, hsl(" + rabbitCustomizer.rabbit.colorH + ",100%,15%) 0%, hsl(" + rabbitCustomizer.rabbit.colorH + ",100%,50%) 50%, hsl(" + rabbitCustomizer.rabbit.colorH + ",100%,85%) 100%)"

var rabbitSky;
var isMobile = false;

if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    isMobile = true;

    /* Disable stuff for mobile, performance */
    if(localStorage.getItem("setting-disable-screen-lighting") === null) {
        localStorage.setItem("setting-disable-screen-lighting", "true")
    }

    if(localStorage.getItem("setting-disable-reflection") === null) {
        localStorage.setItem("setting-disable-reflection", "true")
    }

    /* change emoji picker */
    emojiPicker = new FgEmojiPicker({
        trigger: '#emoji-mobile-button',
        dir: "./extras/",
        position: ['bottom', 'left'],
        emit(obj, triggerElement) {
            rabbitSky.sendChat(obj.emoji);
            rabbitSky.focus();
            emojiPicker.functions.removeAllEmojiPicker();
        }
    });

}

if(window.devicePixelRatio > 1) {
    if(localStorage.getItem("setting-disable-antialias") === null) {
        localStorage.setItem("setting-disable-antialias", "true");
    }

    document.getElementById("label-setting-low-scale").classList.remove("none");
}

var connectionTimer;

// Ready checker
var loadingDom = document.getElementById("loading-progress");
function checkReady(num) {
    switch(num) {
        case 0:
            loadingDom.innerHTML = "Loading Font...";
            if(!font.isReady()) {
                setTimeout(function() { checkReady(num) }, 500);
            } else {
                checkReady(num+1);
            }
            break;
        case 1:
            loadingDom.innerHTML = "Loading Chat Filter...";
            if(!chatFilter.isReady()) {
                setTimeout(function() { checkReady(num) }, 500);
            } else {
                checkReady(num+1);
            }
            break;
        case 2:
            loadingDom.innerHTML = "Loading Configurations...";
            if(!config.isReady()) {
                setTimeout(function() { checkReady(num) }, 500);
            } else {
                var checkError = config.checkError();
                if(checkError == "") {
                    /* Force disable embed chat on mobile */
                    if(isMobile) {
                        config.embed.chat = false;
                    }

                    rabbitSky = new RabbitSky(config.embed.type, config.embed.id, config.embed.chat);
                    fillChannel();

                    var nowPlaying;
                    switch(config.embed.type) {
                        case 'youtube':
                            nowPlaying = "youtu.be/" + config.embed.id;
                            break;
                        case 'twitch':
                        default:
                            nowPlaying = "twitch.tv/" + config.embed.id;
                            break;
                    }

                    document.getElementById('main-menu-now-playing').innerHTML = nowPlaying;

                    checkReady(num+1);
                } else {
                    console.error(checkError);
                    document.getElementById("loading-progress-square").classList.add("none");
                    loadingDom.innerHTML = "Failed to load configurations. Please try again later.";
                }
            }
            break;
        case 3:
            loadingDom.innerHTML = "Loading Dance Floor...";
            if(!rabbitSky.isReady()) {
                setTimeout(function() { checkReady(num) }, 500);
            } else {
                checkReady(num+1);
            }
            break;
        case 4:
            rabbitSky.initChatFilter(chatFilter);
            rabbitSky.loadSettings();
            rabbitSky.disconnectHandler(onPlayerDisconnect);
            rabbitSky.setDomContainer(document.getElementById("in-game-container"));
            rabbitSky.mainRabbit.setColor(rabbitCustomizer.rabbit.colorH, rabbitCustomizer.rabbit.colorS, rabbitCustomizer.rabbit.colorL);

            /* Slows down movement for mobile */
            if(isMobile) {
                rabbitSky.controls.movementSpeed = rabbitSky.controls.movementSpeed / 1.5;
                rabbitSky.controls.lookSpeed = rabbitSky.controls.lookSpeed / 1.5;
            }

            /* For Gamepad */
            rabbitSky.gamepadController.uiShowVolume = showVolume;
            rabbitSky.gamepadController.uiToggleEmbedChat = toggleEmbedChat;
            rabbitSky.gamepadController.uiToggleAll = toggleUI;

            initListenAll();
            channelLoad();
            document.getElementById("loading").classList.add("none");
            document.getElementById("main-menu").classList.remove("none");
            document.getElementById("settings-button").classList.remove("none");
            document.getElementById("settings-button-popup").classList.remove("none");
            document.getElementById("customize-button").classList.remove("none");
            document.getElementById("customize-button-popup").classList.remove("none");
            setTimeout(function(){
                document.getElementById("settings-button-popup").classList.add("none");
                document.getElementById("customize-button-popup").classList.add("none");
            }, 6000);
            break;
    }
}

function fillChannel() {
    var divDom = document.getElementById('main-menu-channel-list-dyn');

    var html = "";

    if(config.servers.length <= 0) {
        html = '<div class="text-center pt-10">No server found. Refresh?</div>';
    } else {
        for(var i = 0; i < config.servers.length; i++) {
            var id = i+1;
            var wsScheme = (config.servers[i].secure) ? "wss://" : "ws://";
            var wsURL = wsScheme + config.servers[i].host;

            html += '<div class="main-menu-channel connect-channel disabled" id="main-menu-channel-' + id + '" data-url="' + wsURL + '">';
            html += '    <div class="channel-name">';
            html += config.servers[i].name;
            html += '    </div>';
            html += '    <div class="channel-players">';
            html += '        <div class="channel-text-info">Players:</div>';
            html += '        <div class="channel-players-num" id="channel-players-' + id + '">-</div>';
            html += '    </div>';
            html += '    <div class="channel-ping">';
            html += '        <div class="channel-text-info">Ping:</div>';
            html += '        <div class="channel-ping-num" id="channel-ping-' + id + '">-</div>';
            html += '    </div>';
            html += '    <div class="channel-button">';
            html += '        <div class="channel-join-button" id="channel-join-button-' + id + '">-</div>';
            html += '    </div>';
            html += '</div>';
            html += '\n';
        }
    }

    divDom.innerHTML = html;
    clickButtonListener();
}

function channelLoad() {
    document.getElementById("main-menu-channel-loading").classList.remove("none");
    document.getElementById("channel-refresh").classList.add('disabled');

    var connectDom = document.getElementsByClassName('connect-channel');
    for(var i = 0; i < connectDom.length; i++) {
        connectDom[i].classList.add('disabled');
    }

    setTimeout(function(){
        document.getElementById("channel-refresh").classList.remove('disabled');
    }, 3000);

    config.checkPlayers();
    setTimeout(checkPlayers, 200);
}

function checkPlayers() {
    var stillLoading = 0;
    for(var i = 0; i < config.servers.length; i++) {
        var domID = i + 1;
        var dom = document.getElementById('main-menu-channel-' + domID);
        if(dom.classList.contains('disabled')) {
            if(config.servers[i].fetching) {
                stillLoading++;
            } else {
                document.getElementById('channel-players-' + domID).innerHTML = config.servers[i].players + ' / ' + config.servers[i].maxPlayers;

                if(config.servers[i].canJoin) {
                    document.getElementById('channel-join-button-' + domID).innerHTML = "JOIN";
                    document.getElementById('channel-ping-' + domID).innerHTML = (config.servers[i].ping) ? config.servers[i].ping + " ms" : "???";
                    dom.classList.remove('disabled');
                } else {
                    if(config.servers[i].maxPlayers > 0) {
                        document.getElementById('channel-join-button-' + domID).innerHTML = "FULL";
                        document.getElementById('channel-ping-' + domID).innerHTML = (config.servers[i].ping) ? config.servers[i].ping + " ms" : "???";
                    } else {
                        document.getElementById('channel-join-button-' + domID).innerHTML = "ERROR";
                    }
                }
            }
        }
    }

    if(stillLoading <= 0) {
        document.getElementById("main-menu-channel-loading").classList.add("none");
    } else {
        setTimeout(checkPlayers, 100);
    }
}

function connectChannel(wsURL){
    document.getElementById("main-menu").classList.add("none");
    document.getElementById("loadgame").classList.remove("none");
    rabbitSky.connect(wsURL);
    connectionTimer = setTimeout(connectWebsocketCheck, 100);
}

function connectWebsocketCheck() {
    if(rabbitSky.isConnected()) {
        document.getElementById("loadgame").classList.add("none");
        generalStartAnimation();
        initFirstHelpPopup();
    } else {
        var getDisconnectReason = rabbitSky.getDisconnectedReason();
        if(getDisconnectReason != "") {
            document.getElementById("loadgame").classList.add("none");
            document.getElementById("connect-error-reason").innerHTML = getDisconnectReason;
            document.getElementById("error-connect").classList.remove("none");
        } else {
            connectionTimer = setTimeout(connectWebsocketCheck, 100);
        }
    }
}

function onPlayerDisconnect() {
    if(!rabbitSky.isShowing()) {
        return;
    }

    rabbitSky.stop();

    var getDisconnectReason = rabbitSky.getDisconnectedReason();
    if(getDisconnectReason == "") {
        getDisconnectReason = "Timed out"
    }

    document.getElementById("disconnect-reason").innerHTML = getDisconnectReason;
    document.getElementById('popup-disconnected-container').classList.remove('none');
    document.getElementById('popup-reconnect-container').classList.add('none');

    showPopup("disconnected", true);

    if(typeof connectionTimer !== 'undefined') {
        clearInterval(connectionTimer);
    }
}

function reconnect() {
    if(typeof connectionTimer !== 'undefined') {
        clearInterval(connectionTimer);
    }

    document.getElementById('popup-disconnected-container').classList.add('none');
    document.getElementById('popup-reconnect-container').classList.remove('none');

    rabbitSky.connect();
    connectionTimer = setTimeout(reconnectWebsocketCheck, 100);
}

function reconnectWebsocketCheck() {
    if(rabbitSky.isConnected()) {
        forceHidePopup();
        generalStartAnimation();
    } else {
        // The error is managed by onPlayerDisconnect, idk why
        connectionTimer = setTimeout(reconnectWebsocketCheck, 100);
    }
}

function generalStartAnimation() {
    rabbitSky.start();
    rabbitSky.show();
    rabbitSky.focus();
    rabbitSky.showEmbedChat();

    showEmbedChatHideButton();
    showHelpButton();
    showChat();
    showTouchControl();

    /* Remove all menu popup and customize button */
    document.getElementById("customize-button").classList.add("none");
    document.getElementById("settings-button-popup").classList.add("none");
    document.getElementById("customize-button-popup").classList.add("none");

    /* If mobile, vol max and unmute */
    if(isMobile) {
        rabbitSky.embed.unmute();
        rabbitSky.embed.setVolume(100);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    checkReady(0);
});

/* From this line, it only contains listener for dom.
 * Like game menu, settings ui, chatbox ui.
 * ---
 * No logic on the game / scene.
 * Every logic is on RabbitSky module
 */

var showUI = true;

function toggleUI() {
    if(showUI) {
        showUI = false;

        document.getElementById('settings-button').classList.add("none");
        document.getElementById('fps').classList.add("none");
        hideEmbedChatHideButton();
        hideHelpButton();
        hideChat();
    } else {
        showUI = true;

        document.getElementById('settings-button').classList.remove("none");
        document.getElementById('fps').classList.remove("none");
        showEmbedChatHideButton();
        showHelpButton();
        showChat();
    }
}

function initFirstHelpPopup() {
    if(isMobile) {
        return;
    }

    if(!document.getElementById("game-first-info").classList.contains("none")) {
        return;
    }

    document.getElementById("game-first-info").classList.remove("none");

    // Gamepad Listener
    rabbitSky.gamepadController.uiHideFirstHelp = function() {
        document.getElementById("game-first-info").classList.add("none");
        rabbitSky.gamepadController.uiHideFirstHelp = undefined;
    };

    window.addEventListener("keydown", function exitGameFirstInfo(evt){
        switch ( evt.key ) {
            case "h":
            case "w":
            case "a":
            case "s":
            case "d":
            case "ArrowUp":
            case "ArrowDown":
            case "ArrowLeft":
            case "ArrowRight":
                document.getElementById("game-first-info").classList.add("none");
                window.removeEventListener("keydown", exitGameFirstInfo);
                break;
        }
    });
}

function showHelpButton() {
    if(isMobile) {
        return;
    }

    document.getElementById('help-button').classList.remove("none");
}

function hideHelpButton() {
    document.getElementById('help-button').classList.add("none");
}

function showChat() {
    if(isMobile) {
        return;
    }

    document.getElementById("chatbox").classList.remove("none");
    rabbitSky.showChat();
}

function hideChat() {
    document.getElementById("chatbox").classList.add("none");
    rabbitSky.hideChat();
}

function showEmbedChatHideButton() {
    if(!config.embed.chat) {
        return;
    }

    if(isMobile) {
        return;
    }

    document.getElementById('hide-embed-chat-button').classList.remove("none");
}

function hideEmbedChatHideButton() {
    document.getElementById('hide-embed-chat-button').classList.add("none");
}

function showTouchControl() {
    if(!isMobile) {
        return;
    }

    document.getElementById("mobile-control").classList.remove("none");
    document.getElementById("mobile-video-control").classList.remove("none");
    document.getElementById("emoji-mobile-button").classList.remove("none");

    if(!document.fullscreenEnabled) {
        document.getElementById("mobile-video-control-fullscreen").classList.add("none");
    }
}

function hideTouchControl() {
    document.getElementById("mobile-control").classList.add("none");
    document.getElementById("mobile-video-control").classList.add("none");
    document.getElementById("emoji-mobile-button").classList.add("none");
}

function hidePopup() {
    var blockerDom = document.getElementById('blocker');

    if(!blockerDom.classList.contains("noexit")){
        var popupBox = document.getElementsByClassName('popup-box');
        for(var i = 0; i < popupBox.length; i++) {
            popupBox[i].classList.add("none");
        }

        document.getElementById('blocker').classList.add("none");

        if(rabbitCustomizer.isAnimating) {
            rabbitCustomizer.stop();
        }

        if(rabbitSky.isShowing()) {
            rabbitSky.focus();
        }
    }
}

function forceHidePopup() {
    document.getElementById('blocker').classList.remove("noexit");
    hidePopup();
}

function showPopup(id, noexit) {
    forceHidePopup(); // if double popup show like disconnected when opened setting popup, close the first one

    var popupDom = document.getElementById(id);
    if(popupDom) {
        popupDom.classList.remove("none");

        if(typeof noexit !== 'undefined' && noexit) {
            document.getElementById('blocker').classList.add("noexit");
        }

        document.getElementById('blocker').classList.remove("none");

        if(id == "rabbit-color-picker") {
            rabbitCustomizer.start();
        }

        if(rabbitSky.isShowing()) {
            rabbitSky.unfocus();
        }
    }
}

var volumeBoxTimer;

function showVolume() {
    if(rabbitSky.embed.isMuted()) {
        document.getElementById("volume-num").innerHTML = "MUTED";
        document.getElementById("volume-bar-inside").style.width = "0";
    } else {
        var vol = rabbitSky.embed.getVolume();
        document.getElementById("volume-num").innerHTML = vol;
        document.getElementById("volume-bar-inside").style.width = vol + "%";
    }

    document.getElementById("volume").classList.remove("none");

    if(typeof volumeBoxTimer !== 'undefined') {
        clearInterval(volumeBoxTimer);
    }

    volumeBoxTimer = setTimeout(function(){
        document.getElementById("volume").classList.add("none");
    }, 3000);
}

function toggleEmbedChat() {
    if(rabbitSky.isEmbedChatShow()) {
        document.getElementById("hide-embed-chat-button").innerHTML = "SHOW CHAT";
        document.getElementById("hide-embed-chat-button").title = "Show Embed Chat";
        rabbitSky.hideEmbedChat();
    } else {
        document.getElementById("hide-embed-chat-button").innerHTML = "HIDE CHAT";
        document.getElementById("hide-embed-chat-button").title = "Hide Embed Chat";
        rabbitSky.showEmbedChat();
    }

    rabbitSky.focus();
}

function clickButtonListener() {
    var connectDom = document.getElementsByClassName('connect-channel');
    for(var i = 0; i < connectDom.length; i++) {
        connectDom[i].addEventListener('click', function() {
            if(!this.classList.contains('disabled')) {
                connectChannel(this.getAttribute('data-url'));
            }
        });
    }
}

function mobileControlMove(evt) {
    if(evt.touches) {
        evt.preventDefault();

        var touchNum = -1;
        for(var i = 0; i < evt.touches.length; i++) {
            var targetID = evt.touches[i].target.id;
            if (targetID == "mobile-control-move" || targetID == "mobile-control-move-button") {
                touchNum = i;
                break;
            }
        }

        if(touchNum < 0) {
            return
        }

        var x = 0;
        var y = 0;

        var box = document.getElementById("mobile-control-move");
        var button = document.getElementById("mobile-control-move-button");

        var element = box;

        while(element) {
            x += (element.offsetLeft - element.scrollLeft + element.clientLeft);
            y += (element.offsetTop - element.scrollTop + element.clientTop);
            element = element.offsetParent;
        }

        var touchX = evt.touches[touchNum].pageX - x - (box.clientWidth / 2);
        var touchY = evt.touches[touchNum].pageY - y - (box.clientHeight / 2);

        if(touchX < -5) {
            rabbitSky.controls.moveLeft = true;
            rabbitSky.controls.moveRight = false;
        } else if (touchX > 5) {
            rabbitSky.controls.moveLeft = false;
            rabbitSky.controls.moveRight = true;
        }

        if(touchY < -5) {
            rabbitSky.controls.moveForward = true;
            rabbitSky.controls.moveBackward = false;
        } else if (touchY > 5) {
            rabbitSky.controls.moveForward = false;
            rabbitSky.controls.moveBackward = true;
        }

        var currX = evt.touches[touchNum].pageX - x;
        var currY = evt.touches[touchNum].pageY - y;

        var minX = button.clientWidth / 2;
        var maxX = box.clientWidth - minX;

        if(currX < minX) {
            currX = minX;
        } else if (currX > maxX) {
            currX = maxX;
        }

        var minY = button.clientHeight / 2;
        var maxY = box.clientHeight - minY;

        if(currY < minY) {
            currY = minY;
        } else if (currY > maxY) {
            currY = maxY;
        }

        button.style.left = currX - (button.clientWidth / 2) + "px";
        button.style.top = currY - (button.clientHeight / 2) + "px";
    }
}

function mobileControlLook(evt) {
    if(evt.touches) {
        evt.preventDefault();

        var touchNum = -1;
        for(var i = 0; i < evt.touches.length; i++) {
            var targetID = evt.touches[i].target.id;
            if (targetID == "mobile-control-look" || targetID == "mobile-control-look-button") {
                touchNum = i;
                break;
            }
        }

        if(touchNum < 0) {
            return
        }

        var x = 0;
        var y = 0;

        var box = document.getElementById("mobile-control-look");
        var button = document.getElementById("mobile-control-look-button");

        var element = box;

        while(element) {
            x += (element.offsetLeft - element.scrollLeft + element.clientLeft);
            y += (element.offsetTop - element.scrollTop + element.clientTop);
            element = element.offsetParent;
        }

        var touchX = evt.touches[touchNum].pageX - x - (box.clientWidth / 2);
        var touchY = evt.touches[touchNum].pageY - y - (box.clientHeight / 2);

        if(touchX != 0) {
            var touch = touchX * 10;
            if(touch < -200) {
                touch = -200;
            } else if(touch > 200) {
                touch = 200;
            }

            rabbitSky.controls.mouseX = touch;
        }

        if(touchY != 0) {
            var touch = touchY;
            if(touch < -20) {
                touch = -20;
            } else if(touch > 20) {
                touch = 20;
            }

            rabbitSky.controls.mouseY = touch * 10;
        }

        var currX = evt.touches[touchNum].pageX - x;
        var currY = evt.touches[touchNum].pageY - y;

        var minX = button.clientWidth / 2;
        var maxX = box.clientWidth - minX;

        if(currX < minX) {
            currX = minX;
        } else if (currX > maxX) {
            currX = maxX;
        }

        var minY = button.clientHeight / 2;
        var maxY = box.clientHeight - minY;

        if(currY < minY) {
            currY = minY;
        } else if (currY > maxY) {
            currY = maxY;
        }

        button.style.left = currX - (button.clientWidth / 2) + "px";
        button.style.top = currY - (button.clientHeight / 2) + "px";
    }
}

function mobileControlMoveEnd(evt) {
    rabbitSky.controls.moveRight = false;
    rabbitSky.controls.moveLeft = false;
    rabbitSky.controls.moveForward = false;
    rabbitSky.controls.moveBackward = false;

    var box = document.getElementById("mobile-control-move");
    var button = document.getElementById("mobile-control-move-button");
    button.style.left = (box.clientWidth / 2) - (button.clientWidth / 2) + "px";
    button.style.top = (box.clientHeight / 2) - (button.clientHeight / 2) + "px";
}

function mobileControlLookEnd(evt) {
    rabbitSky.controls.mouseX = 0;
    rabbitSky.controls.mouseY = 0;

    var box = document.getElementById("mobile-control-look");
    var button = document.getElementById("mobile-control-look-button");
    button.style.left = (box.clientWidth / 2) - (button.clientWidth / 2) + "px";
    button.style.top = (box.clientHeight / 2) - (button.clientHeight / 2) + "px";
}

var holdCTRL = false;

function initListenAll() {
    document.getElementById("channel-refresh").addEventListener('click', function(){
        if(this.classList.contains('disabled')) {
            return;
        }

        channelLoad();
    });

    document.getElementById("settings-button").addEventListener('click', function(){
        showPopup("settings");
    });

    document.getElementById("help-button").addEventListener('click', function(){
        showPopup("help");
    });

    document.getElementById("customize-button").addEventListener('click', function(){
        showPopup("rabbit-color-picker");
    });

    document.getElementById("blocker").addEventListener('click', function(){
        hidePopup();
    });

    document.getElementById("hide-embed-chat-button").addEventListener('click', function(){
        toggleEmbedChat();
    });

    var popupExitButton = document.getElementsByClassName('popup-exit');
    for(var i = 0; i < popupExitButton.length; i++) {
        popupExitButton[i].addEventListener('click', function() {
            hidePopup();
        });
    }

    // Back to menu button
    var backToMenuButton = document.getElementsByClassName('back-to-menu');
    for(var i = 0; i < backToMenuButton.length; i++) {
        backToMenuButton[i].addEventListener('click', function() {
            if(rabbitSky.isShowing) {
                rabbitSky.hide();
                rabbitSky.embed.stop();
                rabbitSky.clearFPS();
                rabbitSky.hideEmbedChat();

                forceHidePopup();
                hideHelpButton();
                hideChat();
                hideTouchControl();
            }

            document.getElementById("error-connect").classList.add("none");
            document.getElementById("main-menu").classList.remove("none");
            channelLoad();
        });
    }

    // Stay Offline Button
    var stayOfflineButton = document.getElementsByClassName('stay-offline');
    for(var i = 0; i < stayOfflineButton.length; i++) {
        stayOfflineButton[i].addEventListener('click', function() {
            rabbitSky.start();
            forceHidePopup();
        });
    }

    // Reconnect Button
    var reconnectButton = document.getElementsByClassName('reconnect');
    for(var i = 0; i < reconnectButton.length; i++) {
        reconnectButton[i].addEventListener('click', function() {
            reconnect();
        });
    }

    // Init Listeners Settings
    var settingCheckbox = document.getElementsByClassName('setting-checkbox')
    for(var i = 0; i < settingCheckbox.length; i++) {
        settingCheckbox[i].addEventListener('change', function() {
            rabbitSky.changeSettings(this.id, this.checked);
        });
    }

    // Add Event Listener for settings checkbox
    var classSettingTab = document.getElementsByClassName("setting-tab");
    for(var i = 0; i < classSettingTab.length; i++) {
        classSettingTab[i].addEventListener('click', function(){
            var selectedTab = document.getElementsByClassName("setting-tab selected");
            for(var i2 = 0; i2 < selectedTab.length; i2++){
                selectedTab[i2].classList.remove("selected");
            }

            this.classList.add("selected");

            var idName = this.getAttribute("data-id");

            var selectedTabBox = document.getElementsByClassName("setting-tab-select");
            for(var i2 = 0; i2 < selectedTabBox.length; i2++){
                if(idName == selectedTabBox[i2].id){
                    selectedTabBox[i2].classList.remove("none");
                } else {
                    selectedTabBox[i2].classList.add("none");
                }

            }
        });
    }

    // Game On Key Down
    rabbitSky.focusDom.addEventListener( 'keydown', function(evt){
        switch ( evt.key ) {
            case "Enter":
                if(!document.getElementById("chatbox").classList.contains("none")) {
                    document.getElementById("chat-input").focus();
                }
                evt.preventDefault();
                break;
            case "/":
                if(!document.getElementById("chatbox").classList.contains("none")) {
                    document.getElementById("chat-input").value = "/";
                    document.getElementById("chat-input").focus();
                }
                evt.preventDefault();
                break;
            /* its already on window, disabled
            case "Escape":
                hidePopup();
                break;
            */
            case "o":
                showPopup("settings");
                break;
            case "h":
                showPopup("help");
                break;
            case "x":
                toggleEmbedChat();
                break;
            case "c":
                rabbitSky.toggleCamera();
                break;
            case "k":
                rabbitSky.embed.togglePause();
                break;
            case "m":
                rabbitSky.embed.toggleMute();
                showVolume();
                break;
            case "_":
            case "-":
                rabbitSky.embed.volumeDown();
                showVolume();
                break;
            case "+":
            case "=":
                rabbitSky.embed.volumeUp();
                showVolume();
                break;
            case "`":
                toggleUI();
                break;
        }
    });

    // Chat Init
    var chatErrorTimer;
    document.getElementById("chatbox").addEventListener('submit', function(evt){
        evt.preventDefault();

        if(this.classList.contains("none")) {
            return;
        }

        var chatDom = document.getElementById("chat-input");
        var chat = chatDom.value;
        chat = chat.trim().slice(0,50);

        if(chat == "") {
            chatDom.value = "";
            rabbitSky.focus();
        } else {
            emojiPicker.functions.removeAllEmojiPicker();

            var err = rabbitSky.sendChat(chat);
            if (err == "") {
                chatDom.value = "";
                rabbitSky.focus();
            } else {
                var errTimePrint = Math.ceil(err);
                var errTimeTimeout = Math.ceil(err * 1000);
                var chatErrDom = document.getElementById("chaterr");

                chatErrDom.innerHTML = "Please wait " + errTimePrint + " second" + ((errTimePrint > 1) ? "s" : "" ) + ".";;
                chatErrDom.style.display = "block";

                if (typeof chatErrorTimer !== 'undefined') {
                    clearInterval(chatErrorTimer);
                }

                chatErrorTimer = setTimeout(function(){
                    chatErrDom.style.display = "none";
                }, errTimeTimeout);
            }
        }

        return;
    });

    /* Rabbit Slider */
    document.getElementById("rabbit-color-hue").addEventListener('change', function(){
        var h = document.getElementById("rabbit-color-hue").value;
        var s = document.getElementById("rabbit-color-saturation").value;
        var l = document.getElementById("rabbit-color-lightness").value;
        rabbitCustomizer.changeColor(h, s, l);
        rabbitSky.mainRabbit.setColor(h, s, l);

        document.getElementById("rabbit-color-saturation").style.background = "linear-gradient(90deg, hsl(" + h + ",0%,50%) 0%, hsl(" + h + ",100%,50%) 100%)"
        document.getElementById("rabbit-color-lightness").style.background = "linear-gradient(90deg, hsl(" + h + ",100%,15%) 0%, hsl(" + h + ",100%,50%) 50%, hsl(" + h + ",100%,85%) 100%)"
    });

    document.getElementById("rabbit-color-saturation").addEventListener('change', function(){
        var h = document.getElementById("rabbit-color-hue").value;
        var s = document.getElementById("rabbit-color-saturation").value;
        var l = document.getElementById("rabbit-color-lightness").value;
        rabbitCustomizer.changeColor(h, s, l);
        rabbitSky.mainRabbit.setColor(h, s, l);
    });

    document.getElementById("rabbit-color-lightness").addEventListener('change', function(){
        var h = document.getElementById("rabbit-color-hue").value;
        var s = document.getElementById("rabbit-color-saturation").value;
        var l = document.getElementById("rabbit-color-lightness").value;
        rabbitCustomizer.changeColor(h, s, l);
        rabbitSky.mainRabbit.setColor(h, s, l);
    });

    document.getElementById("rabbit-customizer-save").addEventListener('click', function(){
        hidePopup();
    });

    document.getElementById("rabbit-customizer-random").addEventListener('click', function(){
        rabbitSky.mainRabbit.setColor();

        var h = rabbitSky.mainRabbit.colorH;
        var s = rabbitSky.mainRabbit.colorS;
        var l = rabbitSky.mainRabbit.colorL;
        rabbitCustomizer.changeColor(h, s, l);

        document.getElementById("rabbit-color-hue").value = h;
        document.getElementById("rabbit-color-saturation").value = s;
        document.getElementById("rabbit-color-lightness").value = l;
        document.getElementById("rabbit-color-saturation").style.background = "linear-gradient(90deg, hsl(" + h + ",0%,50%) 0%, hsl(" + h + ",100%,50%) 100%)"
        document.getElementById("rabbit-color-lightness").style.background = "linear-gradient(90deg, hsl(" + h + ",100%,15%) 0%, hsl(" + h + ",100%,50%) 50%, hsl(" + h + ",100%,85%) 100%)"
    });

    /* Mobile Button */
    document.getElementById("mobile-control-move").addEventListener("touchstart", mobileControlMove);
    document.getElementById("mobile-control-move").addEventListener("touchmove", mobileControlMove);
    document.getElementById("mobile-control-move").addEventListener("touchcancel", mobileControlMoveEnd);
    document.getElementById("mobile-control-move").addEventListener("touchend", mobileControlMoveEnd);

    document.getElementById("mobile-control-look").addEventListener("touchstart", mobileControlLook);
    document.getElementById("mobile-control-look").addEventListener("touchmove", mobileControlLook);
    document.getElementById("mobile-control-look").addEventListener("touchcancel", mobileControlLookEnd);
    document.getElementById("mobile-control-look").addEventListener("touchend", mobileControlLookEnd);

    document.getElementById("mobile-control-jump").addEventListener("touchstart", function(evt){
        if(evt.touches) {
            rabbitSky.controls.objectJump = true;
        }
    });

    document.getElementById("mobile-control-duck").addEventListener("touchstart", function(evt){
        if(evt.touches) {
            rabbitSky.controls.objectDuck = true;
        }
    });

    document.getElementById("mobile-control-duck").addEventListener("touchend", function(evt){
        if(evt.touches) {
            rabbitSky.controls.objectDuck = false;
        }
    });

    document.getElementById("mobile-video-control-mute").addEventListener("click", function(evt){
        if(rabbitSky.embed.isMuted()) {
            rabbitSky.embed.unmute();
            this.innerHTML = "Mute";
        } else {
            rabbitSky.embed.mute();
            this.innerHTML = "Unmute";
        }

        showVolume();
    });

    document.getElementById("mobile-video-control-pause").addEventListener("click", function(evt){
        if(this.innerHTML == "Pause") {
            rabbitSky.embed.pause();
            this.innerHTML = "Play";
        } else {
            rabbitSky.embed.play();
            this.innerHTML = "Pause";
        }
    });

    document.getElementById("mobile-video-control-fullscreen").addEventListener("click", function(evt){
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    window.addEventListener("keydown", function(evt){
        switch ( evt.key ) {
            case "Escape":
                hidePopup();
                emojiPicker.functions.removeAllEmojiPicker();
                evt.preventDefault();
                break;
            case "Control":
                holdCTRL = true;
                evt.preventDefault();
                break;
            case "Tab":
                evt.preventDefault();
                break;
        }
    });

    window.addEventListener("keyup", function(evt){
        switch ( evt.key ) {
            case "Control":
                holdCTRL = false;
                break;
        }
    });

    window.addEventListener('beforeunload', function (evt) {
        if(holdCTRL && rabbitSky.isShowing()) {
            evt.preventDefault();
            evt.returnValue = '';
        }
    });
}