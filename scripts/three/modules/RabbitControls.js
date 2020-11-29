/* This is copied from FirstPlayerControls
 * Instead controlling the camera, it controls the rabbit
 * We have camera follows the rabbit on another module
 */

import {
	MathUtils,
	Spherical,
	Vector3
} from "../three.module.js";

var RabbitControls = function ( rabbit, camera, domElement ) {

	if ( domElement === undefined ) {

		console.warn( 'THREE.RabbitControls: The second parameter "domElement" is now mandatory.' );
		domElement = document;

	}

	this.rabbit = rabbit;

	this.object = this.rabbit.object;
	this.domElement = domElement;

	this.camera = camera;

	// API

	this.enabled = true;

	this.movementSpeed = 400.0;
	this.lookSpeed = 0.3;

	this.lookVertical = true;

	this.activeLook = true;

	this.constrainVertical = true;
	this.verticalMin = -45; // Changed to Degree instead of PI, i am confusion
	this.verticalMax = 45;  // Same

	// internals

	this.mouseX = 0;
    this.mouseY = 0;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;
	this.moveUp = false;
	this.moveDown = false;

	this.viewHalfX = 0;
    this.viewHalfY = 0;

	// private variables

	var lat = 0;
	var lon = 0;
	var latCam = 0;
	var lonCam = 0;

	var lookDirection = new Vector3();
	var spherical = new Spherical();
    var target = new Vector3();

	// Additional for RabbitSky

	this.mouseClickX = 0;
	this.mouseClickY = 0;
    this.mouseAllowMove = false;
	this.objectInitPosition = this.object.position.clone();
	this.objectDuck = false;
	this.targetPosition = new Vector3();
	this.targetCameraPosition = new Vector3();
	this.noEventInterval;

	// Limit Object
	this.limitMaxX = 3980;
	this.limitMinX = 20;
	this.limitMaxZ = 2980;
	this.limitMinZ = 20;

	// Jump
	this.objectJump = false;
	this.objectJumpStatus = 0;
	this.jumpMax = 30;
	this.jumpSpeed = 120;
	this.yBeforeJump;

	// Bobbing
	this.objectBobbing = 0;
	this.bobMax = 1;
	this.bobSpeed = 2;

	// Change to FPS Camera
	this.isMovingCamera = false;

	//

	if ( this.domElement !== document ) {

		this.domElement.setAttribute( 'tabindex', - 1 );

	}

	//

	this.handleResize = function () {

		if ( this.domElement === document ) {

			this.viewHalfX = window.innerWidth / 2;
			this.viewHalfY = window.innerHeight / 2;

		} else {

			this.viewHalfX = this.domElement.offsetWidth / 2;
			this.viewHalfY = this.domElement.offsetHeight / 2;

		}

	};

	this.onMouseDown = function ( event ) {

		if ( this.domElement !== document ) {

			this.domElement.focus();

		}

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0:
				case 2:
					this.domElement.style.cursor = 'none';

					this.mouseAllowMove = true;
					this.mouseClickX = event.pageX;
					this.mouseClickY = event.pageY;

					if (typeof this.noEventInterval !== 'undefined') {
						clearTimeout(this.noEventInterval);
                    }

					// Hacks for embed, so no click allowed
                    var noEventDom = document.getElementsByClassName("no-event");
                    for (var i = 0; i < noEventDom.length; i++) {

                        noEventDom[i].style.pointerEvents = "none";

                    }

					break;

			}

		}

		this.mouseDragOn = true;

	};

	this.onMouseUp = function ( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0:
				case 2:
					this.domElement.style.cursor = 'auto';

                    this.mouseAllowMove = false;
                    this.mouseX = 0;
                    this.mouseY = 0;

					// Hacks for embed, so no click allowed
                    this.noEventInterval = setTimeout(function(){

                        var noEventDom = document.getElementsByClassName("no-event");
                        for (var i = 0; i < noEventDom.length; i++) {

                            noEventDom[i].style.pointerEvents = "auto";

                        }

					}, 1000);

                    break;

			}

		}

		this.mouseDragOn = false;

	};

	this.onMouseMove = function ( event ) {

		if ( this.mouseAllowMove ) {

			if ( this.domElement === document ) {

				this.mouseX = event.pageX - this.mouseClickX;
                this.mouseY = event.pageY - this.mouseClickY;

			} else {

				this.mouseX = event.pageX - this.domElement.offsetLeft - this.mouseClickX;
                this.mouseY = event.pageY - this.domElement.offsetTop - this.mouseClickY;

			}
		}

	};

	this.onKeyDown = function ( event ) {

		// event.preventDefault();

		switch ( event.keyCode ) {

			case 87: /*W*/ this.moveForward = true; break;
			case 65: /*A*/ this.moveLeft = true; break;
			case 83: /*S*/ this.moveBackward = true; break;
			case 68: /*D*/ this.moveRight = true; break;

			case 38: /*up*/ this.mouseY = -200; break;
			case 40: /*down*/ this.mouseY = 200; break;
			case 37: /*left*/ this.mouseX = -200; break;
			case 39: /*right*/ this.mouseX = 200; break;

			case 69: /* E */ if (this.isMovingCamera || this.rabbit.canFly) { this.moveUp = true; } break;
			case 81: /* Q */ if (this.isMovingCamera || this.rabbit.canFly) { this.moveDown = true; } break;

			case 32: /*spacebar*/ (this.isMovingCamera) ? this.moveUp = true : this.objectJump = true; break;
			case 17: /*leftctrl*/ (this.isMovingCamera) ? this.moveDown = true : this.objectDuck = true; break;

		}

	};

	this.onKeyUp = function ( event ) {

		switch ( event.keyCode ) {

			case 87: /*W*/ this.moveForward = false; break;
			case 65: /*A*/ this.moveLeft = false; break;
			case 83: /*S*/ this.moveBackward = false; break;
			case 68: /*D*/ this.moveRight = false; break;

			case 38: /*up*/
			case 40: /*down*/ this.mouseY = 0; break;
			case 37: /*left*/
			case 39: /*right*/ this.mouseX = 0; break;

			case 69: /* E */ if (this.isMovingCamera || this.rabbit.canFly) { this.moveUp = false; } break;
			case 81: /* Q */ if (this.isMovingCamera || this.rabbit.canFly) { this.moveDown = false; } break;

			case 32: /*spacebar*/ if (this.isMovingCamera) { this.moveUp = false; } break;
			case 17: /*leftctrl*/ (this.isMovingCamera) ? this.moveDown = false : this.objectDuck = false; break;

		}

	};

	this.onBlur = function ( event ) {
		this.resetVar();
	}

	this.lookAt = function ( x, y, z ) {

		if ( x.isVector3 ) {

			target.copy( x );

		} else {

			target.set( x, y, z );

		}

		this.object.lookAt( target );

		setOrientation( this );

		return this;

	};

	this.resetVar = function() {
		this.moveForward = false;
		this.moveBackward = false;
		this.moveLeft = false;
		this.moveRight = false;
		this.moveUp = false;
		this.moveDown = false;
		this.mouseAllowMove = false;
		this.mouseY = 0;
		this.mouseX = 0;
		// this.objectJump = false;
		this.objectDuck = false;
	}

	this.moveCamera = function() {
		this.resetVar();

		lonCam = 0;
		latCam = 0;

		this.isMovingCamera = true;
	}

	this.moveRabbit = function() {
		this.resetVar();
		this.isMovingCamera = false;
	}

	this.updateCamera = function (delta) {

		if(!this.isMovingCamera) {

			return;

		}

		var actualMoveSpeed = delta * this.movementSpeed;

		if ( this.moveForward ) this.camera.translateZ( - actualMoveSpeed );
		if ( this.moveBackward ) this.camera.translateZ( actualMoveSpeed );

		if ( this.moveLeft ) this.camera.translateX( - actualMoveSpeed );
		if ( this.moveRight ) this.camera.translateX( actualMoveSpeed );

		if ( this.moveUp ) this.camera.translateY( actualMoveSpeed );
		if ( this.moveDown ) this.camera.translateY( - actualMoveSpeed );

		var actualLookSpeed = delta * this.lookSpeed;

		var verticalLookRatio = 1;

		lonCam -= this.mouseX * actualLookSpeed;
		if ( this.lookVertical ) latCam -= this.mouseY * actualLookSpeed * verticalLookRatio;

		latCam = Math.max( - 85, Math.min( 85, latCam ) );

		var phi = MathUtils.degToRad( 90 - latCam );
		var theta = MathUtils.degToRad( lonCam );

		var position = this.camera.position;

		this.targetCameraPosition.setFromSphericalCoords( 1, phi, theta ).add( position );

		this.camera.lookAt( this.targetCameraPosition );
	}

	this.update = function () {

		return function update( delta ) {

			if ( this.enabled === false ) {

				return;

			}

			if ( this.isMovingCamera ) {

				this.updateCamera(delta);

				return;

			}

			var actualMoveSpeed = delta * this.movementSpeed;
			var objectCurrentY = this.object.position.y;

			if ( this.moveForward ) {
				this.object.translateZ( actualMoveSpeed );
            }

			if ( this.moveBackward ) {
                this.object.translateZ( - actualMoveSpeed );
            }

            if ( this.moveLeft ) {
                this.object.translateX( actualMoveSpeed );
            }

			if ( this.moveRight ) {
                this.object.translateX( - actualMoveSpeed );
			}


			if(this.rabbit.canFly) {

				if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
				if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

				this.objectInitPosition = this.object.position.clone();

				if( typeof this.yBeforeJump !== 'undefined' && ( this.moveForward || this.moveBackward || this.moveLeft || this.moveRight || this.moveUp || this.moveDown ) ) {
					this.objectJump = false;
					this.objectJumpStatus = 0;
					this.yBeforeJump = undefined;
				}

			} else if( this.moveForward || this.moveBackward || this.moveLeft || this.moveRight ) {

				this.object.position.setY( objectCurrentY );

			}

			// Check if jump first, if not jumping, do the bob
			if( this.objectJump ) {

				// if finish jumping, set position to init
				if( this.objectJumpStatus == 1 && this.object.position.y <= this.yBeforeJump ) {
					this.object.position.setY( this.yBeforeJump );

					this.objectJump = false;
					this.objectJumpStatus = 0;
					this.yBeforeJump = undefined;

				} else {

					if ( this.objectJumpStatus == 0 && this.object.position.y >= ( this.yBeforeJump + this.jumpMax ) ) {

						this.objectJumpStatus = 1;

						this.object.position.setY( this.yBeforeJump + this.jumpMax );

					}

					if(this.objectJumpStatus == 0) {
						if(typeof this.yBeforeJump === 'undefined') {
							this.yBeforeJump = this.object.position.y;
						}

						this.object.position.setY( this.object.position.y + (delta * this.jumpSpeed) );

					} else if(this.objectJumpStatus == 1) {

						this.object.position.setY( this.object.position.y - (delta * this.jumpSpeed) );

					}

				}

			} else if ( !this.rabbit.canFly && ( this.moveForward || this.moveBackward || this.moveLeft || this.moveRight ) ) {

				// Bobbing status save to memory so it knows when to bob up and down
				if( objectCurrentY <= this.objectInitPosition.y ) {

					this.objectBobbing = 1;

				} else if( objectCurrentY >= ( this.objectInitPosition.y + this.bobMax ) ) {

					this.objectBobbing = 0;

				}

				if( this.objectBobbing == 0 ) {

					this.object.position.setY( objectCurrentY - (delta * this.bobSpeed) );

				} else {

					this.object.position.setY( objectCurrentY + (delta * this.bobSpeed) );

				}

			}

			// Duck
			this.rabbit.duck(this.objectDuck);

			// Limit Position If Not Flying
			if ( !this.rabbit.canFly ) {

				if (this.object.position.x >= this.limitMaxX) {

					this.object.position.setX(this.limitMaxX);

				} else if (this.object.position.x <= this.limitMinX) {

					this.object.position.setX(this.limitMinX);

				}

				if (this.object.position.z >= this.limitMaxZ) {

					this.object.position.setZ(this.limitMaxZ);

				} else if (this.object.position.z <= this.limitMinZ) {

					this.object.position.setZ(this.limitMinZ);

				}

			}

			var actualLookSpeed = delta * this.lookSpeed;

			if ( ! this.activeLook ) {

				actualLookSpeed = 0;

			}

			lon -= this.mouseX * actualLookSpeed;
			if ( this.lookVertical ) lat -= this.mouseY * actualLookSpeed;

			// We're moving constrain here so less thinking and more readable
			if ( this.constrainVertical ) {

				lat = Math.max( this.verticalMin, Math.min( this.verticalMax, lat ) );

			} else {

				lat = Math.max( - 85, Math.min( 85, lat ) );

			}

			var phi = MathUtils.degToRad( 90 - lat );
			var theta = MathUtils.degToRad( lon );

			var position = this.object.position;

			this.targetPosition.setFromSphericalCoords( 1, phi, theta ).add( position );

			// Changed: we need to know where rabbit look at to send to server
			this.rabbit.lookAt( this.targetPosition.x, this.targetPosition.y, this.targetPosition.z );

		};

	}();

	// Additional Function
	this.getLookPosition = function () {

		return this.targetPosition;

	}

	function contextmenu( event ) {

		event.preventDefault();

	}

	this.dispose = function () {

		this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
		this.domElement.removeEventListener( 'mousedown', _onMouseDown, false );
		this.domElement.removeEventListener( 'mousemove', _onMouseMove, false );
		this.domElement.removeEventListener( 'mouseup', _onMouseUp, false );

		this.domElement.removeEventListener( 'keydown', _onKeyDown, false );
		this.domElement.removeEventListener( 'keyup', _onKeyUp, false );

		this.domElement.removeEventListener( 'blur', _onBlur, false );

	};

	var _onMouseMove = bind( this, this.onMouseMove );
	var _onMouseDown = bind( this, this.onMouseDown );
	var _onMouseUp = bind( this, this.onMouseUp );
	var _onKeyDown = bind( this, this.onKeyDown );
	var _onKeyUp = bind( this, this.onKeyUp );
	var _onBlur = bind( this, this.onBlur );

	this.domElement.addEventListener( 'contextmenu', contextmenu, false );
	this.domElement.addEventListener( 'mousemove', _onMouseMove, false );
	this.domElement.addEventListener( 'mousedown', _onMouseDown, false );
	this.domElement.addEventListener( 'mouseup', _onMouseUp, false );

	// Changed to dom because we need use another button to do something else
	this.domElement.addEventListener( 'keydown', _onKeyDown, false );
	this.domElement.addEventListener( 'keyup', _onKeyUp, false );

	// Add on blur
	this.domElement.addEventListener( 'blur', _onBlur, false );
	// this.domElement.addEventListener( 'mouseout', _onBlur, false );

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	}

	function setOrientation( controls ) {

		var quaternion = controls.object.quaternion;

		// Changed from z -1 to 1, idk why it negate?
		lookDirection.set( 0, 0, 1 ).applyQuaternion( quaternion );
		spherical.setFromVector3( lookDirection );

		lat = 90 - MathUtils.radToDeg( spherical.phi );
		lon = MathUtils.radToDeg( spherical.theta );

	}

	this.handleResize();

	setOrientation( this );

};

export { RabbitControls };
