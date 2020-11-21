import {
    DirectionalLight,
    HemisphereLight,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from '../three/three.module.js';

import { Rabbit } from '../three/modules/Rabbit.js';
import { OrbitControls } from '../three/modules/OrbitControls.js';

var RabbitCustomizer = function(dom) {
    this.dom = dom;

    this.scene = new Scene();

    this.antiAlias = (window.devicePixelRatio > 1) ? false : true;

    this.renderer = new WebGLRenderer({ alpha: true, antialias: this.antiAlias, canvas: this.dom });
    this.renderer.setClearColor(0xffffff, 0);
    this.renderer.setPixelRatio( window.devicePixelRatio );

    this.camera = new PerspectiveCamera( 60, this.dom.offsetWidth / this.dom.offsetHeight, 1, 200 );
    this.camera.position.set(0, 20, -30);

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.autoRotate = true;

    this.rabbit = new Rabbit();
    this.rabbit.object.lookAt(50, 0, -40);
    this.scene.add(this.rabbit.object);
    this.camera.lookAt(this.rabbit.object.position);

    var lightTop = new HemisphereLight( 0xffffff, 0x000000, 1 );
    this.scene.add(lightTop);

    this.animationID;

    this.init = function() {
        var colorH = localStorage.getItem("rabbit-color-h");
        var colorS = localStorage.getItem("rabbit-color-s");
        var colorL = localStorage.getItem("rabbit-color-l");

        colorH = (colorH === null || colorH == "" || isNaN(colorH)) ? -1 : parseInt(colorH);
        colorS = (colorS === null || colorS == "" || isNaN(colorS)) ? -1 : parseInt(colorS);
        colorL = (colorL === null || colorL == "" || isNaN(colorL)) ? -1 : parseInt(colorL);

        this.changeColor(colorH, colorS, colorL);
    }

    this.changeColor = function(h, s, l) {
        if(h < 0 || h > 360) {
            h = this.rabbit.colorH;
        }

        if(s < 0 || s > 100) {
            s = this.rabbit.colorS;
        }

        if(l < 15 || l > 85) {
            l = this.rabbit.colorL;
        }

        this.rabbit.setColor(h, s, l);

        localStorage.setItem("rabbit-color-h", h);
        localStorage.setItem("rabbit-color-s", s);
        localStorage.setItem("rabbit-color-l", l);
    }

    this.start = function() {
        this.animate();
        this.handleResize();
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

        return true;
    }

    this.animate = function() {
        this.animationID = requestAnimationFrame( _animateCustomizer );

        this.controls.update();
        this.renderer.render( this.scene, this.camera );
    }

    this.handleResize = function() {
        if(this.isAnimating()) {
            this.dom.style.width = "100%";
            this.dom.width = "100%";

            this.renderer.setSize( this.dom.offsetWidth, this.dom.offsetHeight );
            this.camera.aspect = this.dom.offsetWidth / this.dom.offsetHeight;
            this.camera.updateProjectionMatrix();
        }
    }

    this.dispose = function () {
        window.removeEventListener( 'resize', _onResizeCustomizer, false );
    }

    var _animateCustomizer = bind( this, this.animate );
    var _onResizeCustomizer = bind( this, this.handleResize );

    window.addEventListener( 'resize', _onResizeCustomizer, false );

	function bind( scope, fn ) {
		return function () {
			fn.apply( scope, arguments );
		};
    }

    this.init();
};

export { RabbitCustomizer };