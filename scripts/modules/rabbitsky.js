import {
    Clock,
    HemisphereLight,
    PerspectiveCamera,
    RectAreaLight,
    Scene,
    WebGLRenderer,
    BoxBufferGeometry,
    TextureLoader,
    MeshBasicMaterial,
    Mesh,
    BackSide
} from '../three/three.module.js';

import { CameraFollowRabbit } from '../three/modules/CameraFollowRabbit.js';
import { CSS3DRenderer } from '../three/modules/CSS3DRenderer.js';
import { Floor } from '../three/modules/Floor.js';
import { Stage } from '../three/modules/Stage.js';
import { Rabbit } from '../three/modules/Rabbit.js';
import { RabbitControls } from '../three/modules/RabbitControls.js';
import { TwitchTV } from '../three/modules/TwitchTV.js';
import { WebSocketHandler } from '../three/modules/WebSocketHandler.js';
import { RectAreaLightUniformsLib } from '../three/modules/RectAreaLightUniformsLib.js';
import { YouTubeLive } from '../three/modules/YouTubeLive.js';
import { FPS } from './fps.js';

// Init Rect Area Light
RectAreaLightUniformsLib.init();

var RabbitSky = function(embedType, embedID, embedChat) {

    this.embedType = embedType;
    this.embedID = embedID;
    this.embedChat = embedChat;

    // Is loaded
    this.backgroundReady = false;

    // Show Chat Status
    this.isShowChat = true;

    // Create Scene
    this.sceneBackground = new Scene();
    this.sceneScreen = new Scene();
    this.sceneFloor = new Scene();

    // For Gamepad Update
    this.gamepadControllerUpdate;

    // Status Showing
    this.isShowingEmbed = false;

    // That
    var that = this;

    // Add Background
    this.totalBackgroundLoaded = 0;
    this.backgroundStatusUpdate = function() {
        this.totalBackgroundLoaded++;
        if(this.totalBackgroundLoaded >= 3) {
            this.backgroundReady = true;
        }
    }

    var backgroundLoader = new TextureLoader();
    var backgroundSide = backgroundLoader.load('images/sky/side.png', function() { that.backgroundStatusUpdate(); })
    var backgroundTop = backgroundLoader.load('images/sky/top.png', function() { that.backgroundStatusUpdate(); })
    var backgroundBottom = backgroundLoader.load('images/sky/bottom.png', function() { that.backgroundStatusUpdate(); })

    var skyboxGeo = new BoxBufferGeometry(20000, 20000, 20000);
    var skyboxMaterialSide = new MeshBasicMaterial({ map: backgroundSide, side: BackSide, transparent: true })
    var skyboxMaterialTop = new MeshBasicMaterial({ map: backgroundTop, side: BackSide, transparent: true })
    var skyboxMaterialBottom = new MeshBasicMaterial({ map: backgroundBottom, side: BackSide, transparent: true })
    var skybox = new Mesh(skyboxGeo, [ skyboxMaterialSide, skyboxMaterialSide, skyboxMaterialTop, skyboxMaterialBottom, skyboxMaterialSide, skyboxMaterialSide ]);
    skybox.position.set(2000, 0, 1500);

    this.sceneBackground.add(skybox);

    this.chatEmbedWidth = 0;
    this.chatEmbedWidthBeforeHide = 0;
    this.chatEmbedBox = document.createElement("div");
    this.chatEmbedBox.id = "embed-chat-box";
    this.chatEmbedBox.style.zIndex = 4;
    this.chatEmbedBox.style.display = "none";
    this.chatEmbedBox.style.position = "absolute";
    this.chatEmbedBox.style.top = 0;
    this.chatEmbedBox.style.bottom = 0;
    this.chatEmbedBox.style.right = 0;
    this.chatEmbedBox.style.width = this.chatEmbedWidth + "px";
    this.chatEmbedBox.style.backgroundColor = "#18181b";
    document.body.appendChild(this.chatEmbedBox);

    this.chatEmbedResizeState = false;
    this.chatEmbedResizeBox = document.createElement("div");
    this.chatEmbedResizeBox.style.zIndex = 7;
    this.chatEmbedResizeBox.style.display = "none";
    this.chatEmbedResizeBox.style.position = "absolute";
    this.chatEmbedResizeBox.style.width = "2px";
    this.chatEmbedResizeBox.style.top = 0;
    this.chatEmbedResizeBox.style.bottom = 0;
    this.chatEmbedResizeBox.style.cursor = "ew-resize";
    this.chatEmbedResizeBox.style.right = (this.chatEmbedWidth - 1) + "px";
    document.body.appendChild(this.chatEmbedResizeBox);

    if(this.embedChat) {
        var chatIframe = document.createElement("iframe");
        chatIframe.id = "embed-chat-box-iframe";
        chatIframe.style.position = "absolute"
        chatIframe.style.top = 0;
        chatIframe.style.bottom = 0;
        chatIframe.style.right = 0;
        chatIframe.style.left = 0;
        chatIframe.style.border = "none";
        chatIframe.width = "100%";
        chatIframe.height = "100%";
        this.chatEmbedBox.appendChild(chatIframe);

        // Only for twitch
        if(embedType == "twitch") {
            chatIframe.setAttribute("src", "https://www.twitch.tv/embed/" + this.embedID + "/chat?darkpopout&parent=" + window.location.hostname)
        } else {
            chatIframe.setAttribute("src", "https://www.youtube.com/live_chat?dark_theme=1&v=" + this.embedID + "&embed_domain=" + window.location.hostname)
        }
    }

    // Create Renderer
    // First Layer for background color
    this.colorBackground = document.createElement("div");
    this.colorBackground.style.display = "none";
    this.colorBackground.style.position = "absolute"
    this.colorBackground.style.top = 0;
    this.colorBackground.style.bottom = 0;
    this.colorBackground.style.right = 0;
    this.colorBackground.style.left = 0;
    this.colorBackground.style.backgroundColor = "#4857b5";
    this.colorBackground.style.transition = "background-color 2s ease-in-out";
    document.body.appendChild(this.colorBackground);

    // Second layer is for background cube and stage
    this.rendererBackground = new WebGLRenderer({ alpha: true, antialias: true });
    this.rendererBackground.setClearColor(0xffffff, 0);
    this.rendererBackground.setPixelRatio( window.devicePixelRatio );
    this.rendererBackground.setSize( window.innerWidth - this.chatEmbedWidth, window.innerHeight );
    this.rendererBackground.domElement.style.display = "none";
    this.rendererBackground.domElement.style.position = "absolute";
    this.rendererBackground.domElement.style.top = 0;
    this.rendererBackground.domElement.style.left = 0;
    this.rendererBackground.domElement.style.zIndex = 1;
    this.rendererBackground.domElement.style.pointerEvents = "none";
    document.body.appendChild( this.rendererBackground.domElement );

    // Third layer is for embed video
    this.rendererScreen = new CSS3DRenderer();
    this.rendererScreen.setSize( window.innerWidth - this.chatEmbedWidth, window.innerHeight );
    this.rendererScreen.domElement.id = "main-control";
    this.rendererScreen.domElement.style.display = "none";
    this.rendererScreen.domElement.style.position = "absolute";
    this.rendererScreen.domElement.style.top = 0;
    this.rendererScreen.domElement.style.left = 0;
    this.rendererScreen.domElement.style.zIndex = 2;
    this.rendererScreen.domElement.style.outline = "none";
    document.body.appendChild( this.rendererScreen.domElement );

    // Fourth layer is for the rabbits and floor
    this.rendererFloor = new WebGLRenderer({ alpha: true, antialias: true });
    this.rendererFloor.setClearColor(0xffffff, 0);
    this.rendererFloor.setPixelRatio( window.devicePixelRatio );
    this.rendererFloor.setSize( window.innerWidth - this.chatEmbedWidth, window.innerHeight );
    this.rendererFloor.domElement.style.position = "absolute";
    this.rendererFloor.domElement.style.display = "none";
    this.rendererFloor.domElement.style.top = 0;
    this.rendererFloor.domElement.style.left = 0;
    this.rendererFloor.domElement.style.zIndex = 3;
    this.rendererFloor.domElement.style.pointerEvents = "none";
    document.body.appendChild( this.rendererFloor.domElement );

    // Aliasing Dom Element for Key Capture Later
    this.focusDom = this.rendererScreen.domElement;

    // Create TwitchTV or YouTube Live
    this.embed;
    if(embedType == 'youtube') {
        this.embed = new YouTubeLive(this.embedID);
    } else {
        this.embed = new TwitchTV(this.embedID);
    }

    this.sceneScreen.add(this.embed.object);

    // Create Main Player Rabbit
    this.mainRabbit = new Rabbit();

    // Create Floor and add Main Rabbit
    this.floor = new Floor(this.embed.object, this.sceneFloor);
    this.floor.addRabbit(this.mainRabbit);

    // Create Stage
    this.stage = new Stage(this.mainRabbit, this.sceneBackground);

    // Camera
    this.camera = new PerspectiveCamera(60, (window.innerWidth - this.chatEmbedWidth) / window.innerHeight, 1, 50000);

    // Camera Follow Rabbit
    this.cameraRabbit = new CameraFollowRabbit(this.camera, this.mainRabbit);
    this.sceneFloor.add(this.cameraRabbit.object);

    // Object Control
    this.controls = new RabbitControls(this.mainRabbit, this.camera, this.rendererScreen.domElement);

    // Lighting global
    this.lightTop = new HemisphereLight( 0xffffff, 0x000000, 1 );
    this.lightBackgroundTop = this.lightTop.clone();

    this.sceneFloor.add( this.lightTop );
    this.sceneBackground.add( this.lightBackgroundTop );

    // Lighing Screen Square
    this.lightScreen = new RectAreaLight( 0xffffff, 1, this.embed.width, this.embed.height );
    this.lightScreen.position.set( this.embed.position.x, this.embed.position.y, this.embed.position.z );

    this.lightBackgroundScreen =  new RectAreaLight( 0xffffff, 1, this.embed.width + 50, this.embed.height + 50 );
    this.lightBackgroundScreen.position.set( this.embed.position.x, this.embed.position.y, this.embed.position.z);
    this.lightBackgroundScreen.lookAt( this.lightBackgroundScreen.position.x, this.lightBackgroundScreen.position.y, this.lightBackgroundScreen.position.z - 1 );

    this.sceneFloor.add( this.lightScreen );
    this.sceneBackground.add( this.lightBackgroundScreen );

    this.lightScreenOn = true; // For status purpose

    // For RPS
    this.fps = new FPS("fps");

    // WebSocket Handler, the brain
    this.wsHandler = new WebSocketHandler(this.mainRabbit, this.floor);
    this.wsHandler.setBackgroundDom(this.colorBackground);

    // For Delta FPS
    this.clock = new Clock();

    // For start stop animation
    this.animationID;

    // For Resize Stuff, game container
    this.domContainer;

    this.isReady = function() {
        if(this.backgroundReady && this.embed.isReady() && this.stage.isReady()) {
            return true;
        }

        return false;
    }

    this.init = function() {
        this.animate();
        this.embed.init();
    }

    this.connect = function(url) {
        if(!this.wsHandler.connected) {
            this.wsHandler.connect(url);
        }
    }

    this.disconnect = function() {
        if(!this.wsHandler.connected) {
            this.wsHandler.disconnect();
        }
    }

    this.isConnected = function() {
        return this.wsHandler.connected;
    }

    this.getDisconnectedReason = function() {
        return this.wsHandler.getDisconnectedReason();
    }

    this.start = function(){
        this.clock.getDelta(); // forget last time
        this.embed.start();
        this.animateLoop();
    }

    this.stop = function() {
        if(typeof this.animationID !== 'undefined') {
            cancelAnimationFrame(this.animationID);
            this.animationID = undefined;
        }
    }

    this.isAnimating = function() {
        if(typeof this.animationID === 'undefined') {
            return false;
        }

        return true
    }

    this.show = function() {
        this.colorBackground.style.display = "block";
        this.rendererBackground.domElement.style.display = "block";
        this.rendererScreen.domElement.style.display = "block";
        this.rendererFloor.domElement.style.display = "block";

        this.isShowingEmbed = true;
    }

    this.hide = function() {
        this.colorBackground.style.display = "none";
        this.rendererBackground.domElement.style.display = "none";
        this.rendererScreen.domElement.style.display = "none";
        this.rendererFloor.domElement.style.display = "none";

        this.isShowingEmbed = false;
    }

    this.showChat = function() {
        if(this.isShowing()) {
            if(this.isShowChat) {
                document.getElementById("chatbox").style.display = "block";
            }
        }
    }

    this.hideChat = function() {
        document.getElementById("chatbox").style.display = "none";
    }

    this.isEmbedChatShow = function() {
        if(!this.embedChat) {
            return false;
        }

        if(this.chatEmbedBox.style.display == "none") {
            return false;
        }

        return true;
    }

    this.showEmbedChat = function() {
        if(!this.embedChat) {
            return;
        }

        this.chatEmbedWidth = this.chatEmbedWidthBeforeHide;
        if(this.chatEmbedWidth == 0) {
            this.chatEmbedWidth = Math.round(window.innerWidth * 0.2); // default width

            if(this.chatEmbedWidth < 350) {
                this.chatEmbedWidth = 350;
            }
        }

        this.chatEmbedBox.style.width = this.chatEmbedWidth + "px";
        this.chatEmbedBox.style.display = "block";

        this.chatEmbedResizeBox.style.right = (this.chatEmbedWidth - 1) + "px";
        this.chatEmbedResizeBox.style.display = "block";

        this.handleResize();
    }

    this.hideEmbedChat = function() {
        this.chatEmbedWidthBeforeHide = this.chatEmbedWidth;
        this.chatEmbedWidth = 0;

        this.chatEmbedBox.style.display = "none";
        this.chatEmbedResizeBox.style.display = "none";

        this.handleResize();
    }

    this.resizeEmbedChat = function(width) {
        this.chatEmbedWidth = width;
        this.chatEmbedBox.style.width = this.chatEmbedWidth + "px";
        this.handleResize();
    }

    this.isShowing = function(){
        return this.isShowingEmbed;
    }

    this.focus = function() {
        this.focusDom.focus();
    }

    this.unfocus = function() {
        this.focusDom.blur();
    }

    this.sendChat = function(text) {
        return this.wsHandler.sendChat(text)
    }

    this.disconnectHandler = function(handler) {
        this.wsHandler.disconnectHandler = handler;
    }

    this.clearFPS = function() {
        this.fps.clear();
    }

    this.toggleCamera = function() {
        if(this.cameraRabbit.cameraAttached) {
            this.cameraRabbit.detach();
            this.controls.moveCamera();
        } else {
            this.cameraRabbit.attach();
            this.controls.moveRabbit();
        }
    }

    this.setDomContainer = function(dom) {
        this.domContainer = dom;
    }

    this.cloneRendererAA = function(oldRenderer, antialias) {
        if(typeof oldRenderer === "undefined") {
            return oldRenderer;
        }

        if(typeof antialias === "undefined") {
            antialias = false;
        }

        var renderer = new WebGLRenderer({ alpha: true, antialias: antialias });
        renderer.setClearColor( oldRenderer.getClearColor(), oldRenderer.getClearAlpha() );
        renderer.setPixelRatio( oldRenderer.getPixelRatio() );
        renderer.setSize( window.innerWidth - this.chatEmbedWidth, window.innerHeight );
        renderer.domElement.style.cssText = oldRenderer.domElement.style.cssText;
        document.body.appendChild( renderer.domElement );

        return renderer;
    }

    this.destroyRenderer = function(renderer) {
        renderer.domElement.remove();
        renderer.dispose();
    }

    this.changeSettings = function(id, val) {
        if(val) {
            switch(id) {
                case "setting-show-fps":
                    this.fps.enable();
                    break;

                case "setting-disable-antialias":
                    var tempRendererBackground = this.rendererBackground;
                    this.rendererBackground = this.cloneRendererAA(tempRendererBackground, false);
                    this.destroyRenderer(tempRendererBackground);

                    var tempRendererFloor = this.rendererFloor;
                    this.rendererFloor = this.cloneRendererAA(tempRendererFloor, false);
                    this.destroyRenderer(tempRendererFloor);

                    break;

                case "setting-low-scale":
                    this.rendererBackground.setPixelRatio(1);
                    this.rendererFloor.setPixelRatio(1);
                    break;

                case "setting-disable-reflection":
                    this.floor.disableReflection();
                    break;

                case "setting-disable-move-animation":
                    this.wsHandler.disableAnimation();
                    break;

                case "setting-disable-chat":
                    this.wsHandler.disableChat();
                    this.isShowChat = false;
                    this.hideChat()
                    break;

                case "setting-hide-stage":
                    this.stage.hide();
                    this.floor.hideBigRabbit();
                    this.sceneBackground.remove(this.lightBackgroundScreen); // This is part of stage
                    break;

                case "setting-disable-screen-lighting":
                    this.sceneFloor.remove(this.lightScreen);
                    this.sceneBackground.remove(this.lightBackgroundScreen);
                    this.lightScreenOn = false;
                    break;

                case "setting-disable-screen-video":
                    this.embed.object.position.y = 1000000; // Move it far away, visible false causing android bug
                    break;

                case "setting-enable-chat-filter":
                    this.wsHandler.chatFilter.enable();
                    break;
            }
        } else {
            switch(id) {
                case "setting-show-fps":
                    this.fps.disable();
                    break;

                case "setting-disable-antialias":
                    var tempRendererBackground = this.rendererBackground;
                    this.rendererBackground = this.cloneRendererAA(tempRendererBackground, true);
                    this.destroyRenderer(tempRendererBackground);

                    var tempRendererFloor = this.rendererFloor;
                    this.rendererFloor = this.cloneRendererAA(tempRendererFloor, true);
                    this.destroyRenderer(tempRendererFloor);
                    break;

                case "setting-low-scale":
                    this.rendererBackground.setPixelRatio(window.devicePixelRatio);
                    this.rendererFloor.setPixelRatio(window.devicePixelRatio);
                    break;

                case "setting-disable-reflection":
                    this.floor.enableReflection();
                    break;

                case "setting-disable-move-animation":
                    this.wsHandler.enableAnimation();
                    break;

                case "setting-disable-chat":
                    this.wsHandler.enableChat();
                    this.isShowChat = true;
                    this.showChat();
                    break;

                case "setting-hide-stage":
                    this.stage.show();
                    this.floor.showBigRabbit();
                    if(this.lightScreenOn) {
                        this.sceneBackground.add(this.lightBackgroundScreen); // This is part of stage
                    }
                    break;

                case "setting-disable-screen-lighting":
                    this.sceneFloor.add(this.lightScreen);
                    this.sceneBackground.add(this.lightBackgroundScreen);
                    this.lightScreenOn = true;
                    break;

                case "setting-disable-screen-video":
                    this.embed.object.position.y = this.embed.position.y;
                    break;

                case "setting-enable-chat-filter":
                    this.wsHandler.chatFilter.disable();
                    break;
            }
        }

        var saveValue = (val) ? 'true' : 'false';
        localStorage.setItem(id, saveValue);
    };

    this.loadSettings = function() {
        // Check Local Storage
        for (var i = 0; i < localStorage.length; i++){
            var key = localStorage.key(i);
            if (key.substring(0, 8) == "setting-") {
                var domSetting = document.getElementById(key);
                if(domSetting) {
                    var val = localStorage.getItem(key);
                    var valBool = (val == 'true') ? true : false;
                    domSetting.checked = valBool;
                    this.changeSettings(key, valBool);
                }
            }
        }
    }

    this.initChatFilter = function(chatFilterModule) {
        this.wsHandler.chatFilter = chatFilterModule;
    }

    this.animate = function() {
        var getAnimationDelta = this.clock.getDelta();

        this.wsHandler.updateAnimation(getAnimationDelta);

        if(typeof this.gamepadControllerUpdate !== 'undefined') {
            this.gamepadControllerUpdate();
        }

        this.controls.update(getAnimationDelta);
        this.stage.update(getAnimationDelta);
        this.cameraRabbit.update();

        this.rendererBackground.render( this.sceneBackground, this.camera );
        this.rendererScreen.render( this.sceneScreen, this.camera );
        this.rendererFloor.render( this.sceneFloor, this.camera );
    }

    this.animateLoop = function() {
        this.animationID = requestAnimationFrame( _animateRabbitSky );

        this.animate();
        this.fps.update();
    }

    this.handleResize = function() {
        if(typeof this.domContainer !== 'undefined') {
            this.domContainer.style.right = this.chatEmbedWidth + "px";
        }

        this.rendererBackground.setSize( window.innerWidth - this.chatEmbedWidth, window.innerHeight );
        this.rendererScreen.setSize( window.innerWidth - this.chatEmbedWidth, window.innerHeight );
        this.rendererFloor.setSize( window.innerWidth - this.chatEmbedWidth, window.innerHeight );
        this.camera.aspect = (window.innerWidth - this.chatEmbedWidth) / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.controls.handleResize();
    }

    /* Resize Chat */
    this.resizeEmbedChatMouseDown = function() {
        this.chatEmbedResizeBox.style.width = "auto";
        this.chatEmbedResizeBox.style.right = "0";
        this.chatEmbedResizeBox.style.left = "0";
        this.chatEmbedResizeState = true;
    };

    this.resizeEmbedChatMouseUp = function() {
        this.chatEmbedResizeBox.style.width = "2px";
        this.chatEmbedResizeBox.style.right = (this.chatEmbedWidth - 1) + "px";
        this.chatEmbedResizeBox.style.left = "";
        this.chatEmbedResizeState = false;

        this.focus();
    };

    this.resizeEmbedChatMouseMove = function(evt) {
        if(this.chatEmbedResizeState){
            var w = window.innerWidth - evt.clientX;
            if(w < 250) {
                w = 250;
            } else if(w > (window.innerWidth/2)) {
                w = (window.innerWidth/2);
            }

            this.resizeEmbedChat(w);
        }
    };

    /* End of resize */

    this.dispose = function () {
        window.removeEventListener( 'resize', _onResizeRabbitSky, false );
        this.chatEmbedResizeBox.removeEventListener("mousedown", _onEmbedResizeMouseDownRabbitSky, false);
        this.chatEmbedResizeBox.removeEventListener("mousemove", _onEmbedResizeMouseMoveRabbitSky, false);
        this.chatEmbedResizeBox.removeEventListener("mouseup", _onEmbedResizeMouseUpRabbitSky, false);
        this.chatEmbedResizeBox.removeEventListener("mouseexit", _onEmbedResizeMouseUpRabbitSky, false);
    }

	var _animateRabbitSky = bind( this, this.animateLoop );
	var _onResizeRabbitSky = bind( this, this.handleResize );
	var _onEmbedResizeMouseDownRabbitSky = bind( this, this.resizeEmbedChatMouseDown );
	var _onEmbedResizeMouseUpRabbitSky = bind( this, this.resizeEmbedChatMouseUp );
	var _onEmbedResizeMouseMoveRabbitSky = bind( this, this.resizeEmbedChatMouseMove );

    window.addEventListener( 'resize', _onResizeRabbitSky, false );
    this.chatEmbedResizeBox.addEventListener("mousedown", _onEmbedResizeMouseDownRabbitSky, false);
    this.chatEmbedResizeBox.addEventListener("mousemove", _onEmbedResizeMouseMoveRabbitSky, false);
    this.chatEmbedResizeBox.addEventListener("mouseup", _onEmbedResizeMouseUpRabbitSky, false);
    this.chatEmbedResizeBox.addEventListener("mouseexit", _onEmbedResizeMouseUpRabbitSky, false);

	function bind( scope, fn ) {
		return function () {
			fn.apply( scope, arguments );
		};
    }

    // Init
    this.init();

}

export { RabbitSky }