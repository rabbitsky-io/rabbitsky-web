import {
    BoxBufferGeometry,
    PlaneBufferGeometry,
    MeshStandardMaterial,
    Mesh,
    Vector3
} from "../three.module.js";

import { Reflector } from "./Reflector.js";
import { Rabbit } from './Rabbit.js';

var Floor = function(embed, scene, w, d) {
    this.scene = scene;
    this.embed = embed;

    this.width = (typeof w !== 'undefined') ? w : 4000;
    this.depth = (typeof d !== 'undefined') ? d : 3000;

    this.positionX = Math.round(this.width / 2);
    this.positionZ = Math.round(this.depth / 2);

    this.spawnPadding = 5;
    this.spawnAreaFromBehind = 500;

    this.reflection = true;

    var danceFloorGeo = new BoxBufferGeometry( this.width, this.depth, 4 );
    var danceFloorMaterial = new MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.5, roughness: 0.4, metalness: 0 });
    this.object = new Mesh( danceFloorGeo, danceFloorMaterial );
    this.object.position.set( this.positionX, 0, this.positionZ );
    this.object.rotateX( - Math.PI / 2 );

    var mirrorGeo = new PlaneBufferGeometry( this.width - 2, this.depth - 2 );
    this.objectMirror = new Reflector( mirrorGeo, {
        clipBias: 0.003,
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
        color: 0xffffff
    } );
    this.objectMirror.position.set(this.positionX, -2, this.positionZ);
    this.objectMirror.rotateX( - Math.PI / 2 );

    this.scene.add(this.objectMirror);
    this.scene.add(this.object);

    // Create Big White Rabbit Floor
    this.bigRabbitVisible = true;
    this.bigRabbit = new Rabbit(0, 0, 100, 50, 50, 50);
    this.bigRabbit.object.scale.set(200, 200, 200);
    this.bigRabbit.object.position.set(this.positionX, 1500, this.positionZ - 6000);
    this.bigRabbit.object.lookAt(this.positionX, this.bigRabbit.object.position.y, this.positionZ);

    this.scene.add(this.bigRabbit.object);

    this.addRabbit = function(rabbit, x, y, z) {
        if( typeof x === 'undefined' || typeof y === 'undefined' || typeof z === 'undefined' ) {
            var safePositionX = this.width - (rabbit.width * 2)
            var positionRandomX = this.object.position.x + (Math.floor(Math.random() * safePositionX) - (safePositionX / 2));
            var positionZ = this.object.position.z + (- (this.depth / 2) + this.spawnAreaFromBehind);
            var positionY = (rabbit.height / 2) + this.spawnPadding + this.object.position.y;

            rabbit.move(positionRandomX, positionY, positionZ);
            rabbit.lookAt(new Vector3(this.embed.position.x, positionY, this.embed.position.z))
        } else {
            rabbit.move(parseFloat(x), parseFloat(y), parseFloat(z));
        }

        this.scene.add(rabbit.object);
    };

    this.removeRabbit = function(rabbit) {
        this.scene.remove(rabbit.object);
    };

    this.disableReflection = function() {
        if(this.reflection) {
            this.reflection = false;
            this.scene.remove(this.objectMirror);
        }
    };

    this.enableReflection = function() {
        if(!this.reflection) {
            this.reflection = true;
            this.scene.add(this.objectMirror);
        }
    };

    this.hideBigRabbit = function() {
        if(this.bigRabbitVisible) {
            this.bigRabbitVisible = false;
            this.scene.remove(this.bigRabbit.object);
        }
    };

    this.showBigRabbit = function() {
        if(!this.bigRabbitVisible) {
            this.bigRabbitVisible = true;
            this.scene.add(this.bigRabbit.object);
        }
    };
}


export { Floor }