import {
    BoxBufferGeometry,
    CanvasTexture,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Mesh,
    Object3D,
    Vector3
} from "../three.module.js";

import {
    BufferGeometryUtils
} from "./BuffersGeometryUtils.js";

const RabbitSize = {
    width: 20,
    height: 16,
    depth: 20
};

// Cache here
// Main Rabbit
var geometryRabbitMain = new BoxBufferGeometry( RabbitSize.width, RabbitSize.height, RabbitSize.depth );
var geometryRabbitTail = new BoxBufferGeometry(1,1,1);
geometryRabbitTail.translate(0, -5, -10);

var geometryRabbitEar = new BoxBufferGeometry(4,3,1);
var geometryRabbitEar2 = geometryRabbitEar.clone();
geometryRabbitEar.translate( 5, 9, 8 );
geometryRabbitEar2.translate( -5, 9, 8 );

var geometryRabbitHand = new BoxBufferGeometry(1,10,10);
var geometryRabbitHand2 = geometryRabbitHand.clone();
geometryRabbitHand.translate( 10, 0, 0 );
geometryRabbitHand2.translate( -10, 0, 0 );

var geometriesRabbit = [];
geometriesRabbit.push(geometryRabbitMain);
geometriesRabbit.push(geometryRabbitTail);
geometriesRabbit.push(geometryRabbitEar);
geometriesRabbit.push(geometryRabbitEar2);
geometriesRabbit.push(geometryRabbitHand);
geometriesRabbit.push(geometryRabbitHand2);

// Rabbit Eye
var geometryRabbitEye = new BoxBufferGeometry(4,4,1);
var geometryRabbitEye2 = geometryRabbitEye.clone();
geometryRabbitEye.translate(-4, 1, 10);
geometryRabbitEye2.translate(4, 1, 10);

var geometriesRabbitEye = [];
geometriesRabbitEye.push(geometryRabbitEye);
geometriesRabbitEye.push(geometryRabbitEye2);

// Merge Here
const RabbitGeometry = {
    rabbit: BufferGeometryUtils.mergeBufferGeometries(geometriesRabbit),
    eye: BufferGeometryUtils.mergeBufferGeometries(geometriesRabbitEye),
    chat: new BoxBufferGeometry( 1, 1, 0 )
};

const RabbitMaterial = {
    eye: new MeshStandardMaterial( {
        color: 0x303030,
        emissive: 0x0,
        roughness: 0.3,
        metalness: 0
    })
};

var Rabbit = function(h, s, l, eyeR, eyeG, eyeB) {

    this.colorH = (typeof h === 'undefined') ? (Math.floor(Math.random() * 360)) : parseInt(h);
    this.colorS = (typeof s === 'undefined') ? (Math.floor(Math.random() * 100)) : parseInt(s);
    this.colorL = (typeof l === 'undefined') ? (Math.floor(Math.random() * 70) + 15) : parseInt(l);

    this.colorEyeR = (typeof eyeR === 'undefined') ? "" : parseInt(eyeR);
    this.colorEyeG = (typeof eyeG === 'undefined') ? "" : parseInt(eyeG);
    this.colorEyeB = (typeof eyeB === 'undefined') ? "" : parseInt(eyeB);

    this.width = RabbitSize.width;
    this.height = RabbitSize.height;
    this.depth = RabbitSize.depth;

    this.isDuck = false;

    this.lookX = 0;
    this.lookY = 0;
    this.lookZ = 0;

    // Initialize Object
    var rabbitMaterial = new MeshStandardMaterial( {
        color: "hsl(" + this.colorH + "," + this.colorS + "%," + this.colorL + "%)",
        emissive: "hsl(" + this.colorH + "," + this.colorS + "%," + (this.colorL - 10) + "%)",
        roughness: 0.3,
        metalness: 0
    });

    // Primary Rabbit

    this.object = new Mesh( RabbitGeometry.rabbit, rabbitMaterial );

    // Add Eye
    var rabbitEye;
    if (this.colorEyeR != "" && this.colorEyeG != "" && this.colorEyeB != "" ){
        var eyeMaterial =  new MeshStandardMaterial({
            color: "rgb(" + this.colorEyeR + "," + this.colorEyeG + "," + this.colorEyeB + ")",
            emissive: "rgb(" + (this.colorEyeR - 50) + "," + (this.colorEyeG - 50) + "," + (this.colorEyeB - 50) + ")",
            roughness: 0.3,
            metalness: 0
        })
        rabbitEye = new Mesh( RabbitGeometry.eye, eyeMaterial );
    } else {
        rabbitEye = new Mesh( RabbitGeometry.eye, RabbitMaterial.eye );
    }

    this.object.add( rabbitEye ); // Child: 2

    // Chat stuff
    this.chatTimeout;

    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 500;
    this.textCanvas.height = 60;
    this.textCanvasCtx = this.textCanvas.getContext( '2d' );

    var rabbitChatTexture = new CanvasTexture( this.textCanvas );
    var rabbitChatMaterialCanvas = new MeshBasicMaterial({ map: rabbitChatTexture, transparent: true });

    var positionChatY = (this.height / 2) + (this.textCanvas.height / 5 / 2) + 5; // + 5 for padding

    this.objectChat = new Mesh( RabbitGeometry.chat, rabbitChatMaterialCanvas );
    this.objectChat.visible = false;
    this.objectChat.position.set( 0, positionChatY, 0 );
    this.objectChat.renderOrder = 1;
    this.object.add( this.objectChat ); // Child: 0

    // Websocket Helper for Rotation LookAt
    this.rabbitLookAtHelperVector = new Vector3();
    this.rabbitLookAtHelper = new Object3D();
    this.rabbitLookAtHelper.position.set(0, 0, (this.depth * 10)); // Set to 10x of object depth, because if lags occurs, the head won't turn around
    this.object.add( this.rabbitLookAtHelper ); // Child: 1

    this.setChat = function(chat) {
        if(typeof chat === 'undefined' || chat == "") {
            return;
        }

        // This prevent if chat already sent, but user sent too frequently. Performance Issue.
        if(this.objectChat.visible) {
            return;
        }

        if(/^([A-Z0-9]|\p{Emoji_Component}\p{Emoji_Component}|\p{Extended_Pictographic})$/u.test(chat)) {
            this.textCanvasCtx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);

            this.textCanvas.width = 200;
            this.textCanvas.height = 200;

            this.textCanvasCtx.font = "100px 'Press Start 2P'";
            this.textCanvasCtx.fillStyle = 'white';
            this.textCanvasCtx.textAlign = 'center';
            this.textCanvasCtx.fillText( chat, (this.textCanvas.width / 2), (this.textCanvas.height / 2) );

            this.objectChat.scale.set( this.textCanvas.width / 6, this.textCanvas.height / 6, 1 );
        } else {
            this.textCanvasCtx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);

            this.textCanvasCtx.font = "30px 'Press Start 2P'";
            var textCanvasSize = this.textCanvasCtx.measureText(chat);

            this.textCanvas.width = textCanvasSize.width + 60;
            this.textCanvas.height = 60;

            this.textCanvasCtx.font = "30px 'Press Start 2P'";
            this.textCanvasCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.textCanvasCtx.fillRect(0, 0, this.textCanvas.width - 10, this.textCanvas.height);
            this.textCanvasCtx.fillStyle = 'white';
            this.textCanvasCtx.textAlign = 'left';
            this.textCanvasCtx.fillText( chat, 25, 45 );

            this.objectChat.scale.set( this.textCanvas.width / 6, this.textCanvas.height / 6, 1 );
        }

        this.objectChat.material.map.needsUpdate = true;
        this.objectChat.visible = true;

        if(typeof this.chatTimeout !== 'undefined') {
            clearInterval(this.chatTimeout);
        }

        var thisObj = this;

        this.chatTimeout = setTimeout(function(){
            thisObj.clearChat();
        }, 3000);
    }

    this.clearChat = function(){
        this.objectChat.visible = false;
        this.objectChat.scale.set( 0, 0, 1 );
    }

    this.setColor = function(h, s, l) {
        this.colorH = (typeof h === 'undefined') ? (Math.floor(Math.random() * 360)) : parseInt(h);
        this.colorS = (typeof s === 'undefined') ? (Math.floor(Math.random() * 100)) : parseInt(s);
        this.colorL = (typeof l === 'undefined') ? (Math.floor(Math.random() * 70) + 15) : parseInt(l);

        this.object.material.color.setStyle("hsl(" + this.colorH + "," + this.colorS + "%," + this.colorL + "%)");
        this.object.material.emissive.setStyle("hsl(" + this.colorH + "," + this.colorS + "%," + (this.colorL - 10) + "%)");
    };

    this.currentLookAt = function() {
        this.rabbitLookAtHelper.getWorldPosition(this.rabbitLookAtHelperVector);

        return {
            x: this.rabbitLookAtHelperVector.x,
            y: this.rabbitLookAtHelperVector.y,
            z: this.rabbitLookAtHelperVector.z
        }
    }

    this.move = function(x, y, z) {
        this.object.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
    };

    this.rotate = function(x, y, z) {
        this.object.rotation.set(parseFloat(x), parseFloat(y), parseFloat(z), "XYZ");
    };

    this.lookAt = function(x, y, z) {
        this.lookX = x;
        this.lookY = y;
        this.lookZ = z;

        this.object.lookAt( x, y, z );
    };

    this.duck = function(isDuck) {
        if (isDuck != this.isDuck) {
            if (isDuck) {
                this.object.scale.y = 0.9;
            } else {
                this.object.scale.y = 1;
            }

            this.isDuck = isDuck;
        }
    };

    this.dispose = function() {
        for(var i = 0; i < this.object.children.length; i++) {
            if (typeof this.object.children[i].geometry !== 'undefined') {
                this.object.children[i].geometry.dispose();
            }

            if (typeof this.object.children[i].material !== 'undefined') {
                if(Array.isArray(this.object.children[i].material)) {
                    for(var x = 0; x < this.object.children[i].material.length; x++) {
                        this.object.children[i].material[x].dispose();
                    }
                } else {
                    this.object.children[i].material.dispose();
                }
            }
        }

        this.object.geometry.dispose();
        this.object.material.dispose();
    };

}

export { Rabbit };