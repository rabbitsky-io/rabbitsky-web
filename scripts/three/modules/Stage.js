import {
    BoxBufferGeometry,
    Math,
    MeshStandardMaterial,
    MeshBasicMaterial,
    Mesh,
    TextureLoader,
    PlaneBufferGeometry,
    PointLight
} from '../three.module.js';

import { BufferGeometryUtils } from "./BuffersGeometryUtils.js";

import { Rabbit } from './Rabbit.js';
import { Speaker } from './Speaker.js';

var Stage = function(rabbit, scene) {

    // Stage is Ready?
    this.readyCount = 0;

    this.scene = scene;
    this.rabbit = rabbit;
    this.showAll = true;

    var stageGeo = [];

    var stageTop = new BoxBufferGeometry( 5000, 300, 500 );
    var stageBottom = new BoxBufferGeometry( 5000, 300, 840 );
    stageTop.translate(0, 840, 0);
    stageBottom.translate(0, -840, -170);

    var stageBack = new BoxBufferGeometry( 3400, 1380, 100 );
    stageBack.translate(0, 0, 300);

    var stageLeft = new BoxBufferGeometry( 300, 1380, 500 );
    var stageRight = stageLeft.clone();
    stageLeft.translate(1850, 0, 0);
    stageRight.translate(-1850, 0, 0);

    stageGeo.push(stageBottom);
    stageGeo.push(stageTop);
    stageGeo.push(stageBack);
    stageGeo.push(stageLeft);
    stageGeo.push(stageRight);

    var stageMerge = BufferGeometryUtils.mergeBufferGeometries(stageGeo);

    var stageMaterial = new MeshStandardMaterial( {
        emissive: 0x080808,
        color: 0x141414,
        roughness: 0.3,
        metalness: 0,
        transparent: true,
        opacity: 0.7
    });

    this.stage = new Mesh( stageMerge, stageMaterial );
    this.stage.position.set(2000, 690, 3600);

    this.scene.add(this.stage);

    // Create Lights
    this.backLightDelay = 1500;
    this.backLightFade = 1250;
    this.backLightDelta = 0;
    this.backLightState = 0; // 0 to on, 1 to off, 2 always on, 3 always off
    this.backLight = new PointLight(0x4857b5, 10, 4000, 1);
    this.backLight.position.set(2000, 690, 3700);
    this.scene.add(this.backLight);

    // Create Speaker
    this.speakerLeft = new Speaker();
    this.speakerLeft.position.set(this.stage.position.x + 1330, 765, this.stage.position.z);
    this.speakerLeft.lookAt(this.speakerLeft.position.x, this.speakerLeft.position.y, this.speakerLeft.position.z - 10);

    this.speakerRight = this.speakerLeft.clone();
    this.speakerRight.position.set(this.stage.position.x - 1330, 765, this.stage.position.z);
    this.speakerRight.lookAt(this.speakerRight.position.x, this.speakerRight.position.y, this.speakerRight.position.z - 10);

    this.scene.add(this.speakerLeft);
    this.scene.add(this.speakerRight);

    // Create TV Box
    var tvBoxGeo = [];
    var tvBox = new BoxBufferGeometry( 2020, 1180, 50 );
    var tvBoxBorderTop = new BoxBufferGeometry( 2020, 30, 10 );
    var tvBoxBorderBottom = tvBoxBorderTop.clone();
    tvBoxBorderTop.translate(0, 575, 30);
    tvBoxBorderBottom.translate(0, -575, 30);

    var tvBoxBorderLeft = new BoxBufferGeometry( 30, 1180, 10 );
    var tvBoxBorderRight = new BoxBufferGeometry( 30, 1180, 10 );
    tvBoxBorderLeft.translate(-995, 0, 30);
    tvBoxBorderRight.translate(995, 0, 30);

    var tvBoxBack = new BoxBufferGeometry( 1420, 680, 50 );
    tvBoxBack.translate(0, 0, -50);

    var tvBoxStick = new BoxBufferGeometry( 200, 690, 50 );
    tvBoxStick.translate(0, -345, -100);

    var tvBoxBottom = new BoxBufferGeometry( 700, 20, 200 );
    tvBoxBottom.translate(0, -680, -75);

    tvBoxGeo.push(tvBox);
    tvBoxGeo.push(tvBoxBorderTop);
    tvBoxGeo.push(tvBoxBorderBottom);
    tvBoxGeo.push(tvBoxBorderLeft);
    tvBoxGeo.push(tvBoxBorderRight);
    tvBoxGeo.push(tvBoxBack);
    tvBoxGeo.push(tvBoxStick);
    tvBoxGeo.push(tvBoxBottom);

    var tvBoxMerge = BufferGeometryUtils.mergeBufferGeometries(tvBoxGeo);

    var tvBoxMaterial = new MeshStandardMaterial( {
        emissive: 0x0,
        color: 0x141414,
        roughness: 0.1,
        metalness: 0
    });

    this.tvBox = new Mesh( tvBoxMerge, tvBoxMaterial );
    this.tvBox.position.set(this.stage.position.x, 690, this.stage.position.z + 25);
    this.tvBox.lookAt(this.tvBox.position.x, this.tvBox.position.y, this.tvBox.position.z - 10);

    this.scene.add(this.tvBox);

    // Create Big Black Rabbit Stage
    this.bigRabbit = new Rabbit(0, 0, 10, 205, 205, 205);
    this.bigRabbit.object.scale.set(50, 50, 50);
    this.bigRabbit.object.position.set(this.stage.position.x, 2200, this.stage.position.z + 300);
    this.bigRabbit.object.lookAt(0, this.bigRabbit.object.position.y, 0);
    this.bigRabbit.object.material.transparent = true;
    this.bigRabbit.object.material.opacity = 0.7;

    this.scene.add(this.bigRabbit.object);

    this.smallRabbit = new Rabbit(0, 0, 50);
    this.smallRabbit.object.scale.set(3, 3, 3);
    this.smallRabbit.object.position.set(this.stage.position.x - 380, 35, this.stage.position.z + 50);
    this.smallRabbit.object.lookAt(this.smallRabbit.object.position.x, this.smallRabbit.object.position.y, this.smallRabbit.object.position.z - 10);
    this.smallRabbit.object.rotation.z = Math.degToRad(155);

    this.scene.add(this.smallRabbit.object);

    // Image stuff!
    var that = this;

    var textureLoader = new TextureLoader();

    // Spinning Logo
    this.logoTop;
    this.blockLogoLeft;
    this.blockLogoRight;
    this.bannerLeft;
    this.bannerRight;

    textureLoader.load(
        'images/stage/logo.png',
        function (texture) {
            var material = new MeshBasicMaterial( { map: texture, transparent: true } );
            var geometry = new PlaneBufferGeometry( 4950, 250 );
            that.logoTop = new Mesh( geometry, material );
            that.logoTop.position.set(that.stage.position.x, 1530, that.stage.position.z - 252)
            that.logoTop.lookAt(that.logoTop.position.x, that.logoTop.position.y, 0);
            that.logoTop.renderOrder = 1;
            if(that.showAll) {
                that.scene.add(that.logoTop);
            }
            that.readyCount++;
        },
        undefined,
	    function ( err ) {
            console.error("No Logo Top Found.");
            that.readyCount++;
        }
    );

    textureLoader.load(
        'images/stage/logo-box.png',
        function (texture) {
            var blockLogoGeo = new BoxBufferGeometry( 200, 200, 200 );
            var blockLogoMaterial = new MeshStandardMaterial( {
                map: texture,
                transparent: true,
                roughness: 0.5,
                metalness: 0
            });
            that.blockLogoLeft = new Mesh( blockLogoGeo, blockLogoMaterial );
            that.blockLogoRight = that.blockLogoLeft.clone();
            that.blockLogoLeft.position.set(that.stage.position.x + 1330, 1000, that.stage.position.z);
            that.blockLogoRight.position.set(that.stage.position.x - 1330, 1000, that.stage.position.z);
            that.blockLogoLeft.renderOrder = 1;
            that.blockLogoRight.renderOrder = 1;
            if(that.showAll) {
                that.scene.add(that.blockLogoLeft);
                that.scene.add(that.blockLogoRight);
            }
            that.readyCount++;
        },
        undefined,
	    function ( err ) {
            console.error("No Logo Box Found.");
            that.readyCount++;
        }
    );


    textureLoader.load(
        'images/stage/banner-left.png',
        function (texture) {
            var material = new MeshBasicMaterial( { map: texture, transparent: true } );
            var geometry = new PlaneBufferGeometry( 250, 1280 );
            that.bannerLeft = new Mesh( geometry, material );
            that.bannerLeft.position.set(that.stage.position.x + 1850, 690, that.stage.position.z - 255)
            that.bannerLeft.lookAt(that.bannerLeft.position.x, that.bannerLeft.position.y, 0);
            that.bannerLeft.renderOrder = 1;
            if(that.showAll) {
                that.scene.add(that.bannerLeft);
            }
            that.readyCount++;
        },
        undefined,
	    function ( err ) {
            console.error("No Banner Left Found.");
            that.readyCount++;
        }
    );

    textureLoader.load(
        'images/stage/banner-right.png',
        function (texture) {
            var material = new MeshBasicMaterial( { map: texture, transparent: true } );
            var geometry = new PlaneBufferGeometry( 250, 1280 );
            that.bannerRight = new Mesh( geometry, material );
            that.bannerRight.position.set(that.stage.position.x - 1850, 690, that.stage.position.z - 255)
            that.bannerRight.lookAt(that.bannerRight.position.x, that.bannerRight.position.y, 0);
            that.bannerRight.renderOrder = 1;
            if(that.showAll) {
                that.scene.add(that.bannerRight);
            }
            that.readyCount++;
        },
        undefined,
	    function ( err ) {
            console.error("No Banner Right Found.");
            that.readyCount++;
        }
    );

    this.isReady = function() {
        if(this.readyCount >= 4) {
            return true;
        }

        return false;
    };

    this.lightAlwaysOff = function() {
        this.backLightState = 3;
    };

    this.lightAlwaysOn = function() {
        this.backLightState = 2;
    };

    this.lightBlink = function(delay, fade) {
        if(this.backLightState > 1) {
            this.backLightState = 0;
            this.backLightDelta = 0;
        }
        this.backLightDelay = delay;
        this.backLightFade = fade;
    };

    this.lightColor = function(color) {
        this.backLight.color.setStyle(color);
    };

    this.lightDisable = function() {
        this.backLight.visible = false;
    };

    this.lightEnable = function() {
        this.backLight.visible = true;
    };

    this.update = function(delta) {
        if(this.hideAll) {
            return;
        }

        if(this.backLight.visible) {
            if(this.backLightState == 0) {
                this.backLightDelta += (delta * 1000);
                if(this.backLightDelta > this.backLightDelay) {
                    this.backLightDelta = this.backLightDelta % this.backLightDelay;
                    this.backLightState = 1;
                    this.backLight.intensity = 10 - (10 * ((this.backLightDelta%this.backLightFade) / this.backLightFade));
                } else {
                    if(this.backLightDelta < this.backLightFade) {
                        this.backLight.intensity = 10 * (this.backLightDelta / this.backLightFade);
                    }
                }
            } else if(this.backLightState == 1) {
                    this.backLightDelta += (delta * 1000);
                    if(this.backLightDelta > this.backLightDelay) {
                        this.backLightDelta = this.backLightDelta % this.backLightDelay;
                        this.backLightState = 0;
                        this.backLight.intensity = 10 * ((this.backLightDelta%this.backLightFade) / this.backLightFade);
                    } else {
                        if(this.backLightDelta < this.backLightFade) {
                            this.backLight.intensity = 10 - (10 * (this.backLightDelta / this.backLightFade));
                        }
                    }
            } else if(this.backLightState == 2 && this.backLight.intensity != 10) {
                this.backLight.intensity = 10;
            } else if(this.backLightState == 3 && this.backLight.intensity != 0) {
                this.backLight.intensity = 0;
            }
        }

        this.bigRabbit.object.lookAt(rabbit.object.position.x, this.bigRabbit.object.position.y, rabbit.object.position.z);
        if(typeof this.blockLogoLeft !== 'undefined' && typeof this.blockLogoRight !== 'undefined') {
            this.blockLogoLeft.rotation.y -= delta * 0.5;
            this.blockLogoRight.rotation.y += delta * 0.5;
        }
    };

    this.hide = function(){
        if(this.showAll){
            this.showAll = false;
            this.scene.remove(this.stage);
            this.scene.remove(this.speakerLeft);
            this.scene.remove(this.speakerRight);
            this.scene.remove(this.tvBox);
            this.scene.remove(this.bigRabbit.object);
            this.scene.remove(this.smallRabbit.object);

            if(this.isReady()) {
                this.scene.remove(this.blockLogoLeft);
                this.scene.remove(this.blockLogoRight);
                this.scene.remove(this.logoTop);
                this.scene.remove(this.bannerLeft);
                this.scene.remove(this.bannerRight);
            }
        }
    };

    this.show = function(){
        if(!this.showAll){
            this.showAll = true;
            this.scene.add(this.stage);
            this.scene.add(this.speakerLeft);
            this.scene.add(this.speakerRight);
            this.scene.add(this.tvBox);
            this.scene.add(this.bigRabbit.object);
            this.scene.add(this.smallRabbit.object);

            if(this.isReady()) {
                this.scene.add(this.blockLogoLeft);
                this.scene.add(this.blockLogoRight);
                this.scene.add(this.logoTop);
                this.scene.add(this.bannerLeft);
                this.scene.add(this.bannerRight);
            }
        }
    };

};

export { Stage };