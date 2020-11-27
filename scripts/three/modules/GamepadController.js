var GamepadController = function ( rabbitControl, cameraFollowObject, embed ) {
    this.rabbitControl = rabbitControl;
	this.cameraFollowObject = cameraFollowObject;
	this.embed = embed;

	this.controlMovementSpeed = this.rabbitControl.movementSpeed;
	this.controlMovementSpeedInitValue = this.rabbitControl.movementSpeed;

	this.gamepadCount = 0;

	this.gamepadAxesPressed = {};
	this.gamepadButtonsPressed = {};
	this.gamepadButtonsHoldCount = {};

	// UI Stuff for Main.js
	this.uiToggleAll;
	this.uiShowVolume;
	this.uiToggleEmbedChat;
	this.uiHideFirstHelp;

	this.hasGamepad = function() {
		if(this.gamepadCount > 0) {
			return true;
		}

		return false;
	}

	this.connect = function( event ) {
		this.gamepadCount++;

		for (var i2 = 0; i2 < event.gamepad.axes.length; i2++) {
			this.gamepadAxesPressed[event.gamepad.index + "_" + i2] = true;
		}

		for (var i2 = 0; i2 < event.gamepad.buttons.length; i2++) {
			this.gamepadButtonsPressed[event.gamepad.index + "_" + i2] = true;
			this.gamepadButtonsHoldCount[event.gamepad.index + "_" + i2] = 0;
		}

		if(typeof this.uiHideFirstHelp !== 'undefined') {
			this.uiHideFirstHelp();
		}
	}

	this.disconnect = function( event ) {
		this.gamepadCount--;

		for (var i2 = 0; i2 < event.gamepad.axes.length; i2++) {
			delete this.gamepadAxesPressed[event.gamepad.index + "_" + i2];
		}

		for (var i2 = 0; i2 < event.gamepad.buttons.length; i2++) {
			delete this.gamepadButtonsPressed[event.gamepad.index + "_" + i2];
			delete this.gamepadButtonsHoldCount[event.gamepad.index + "_" + i2];
		}

		this.rabbitControl.movementSpeed = this.controlMovementSpeed;
		this.rabbitControl.resetVar();
	}

	this.update = function() {
		if(!this.hasGamepad) {
			return;
		}

		var somethingPressed = false;

		var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
		for (var i = 0; i < gamepads.length; i++) {
			if(!gamepads[i]) {
				continue;
			}

			var controller = gamepads[i];

			for (var i2 = 0; i2 < controller.axes.length; i2++) {
				var axes = controller.axes[i2];
				var pressedIndex = i + "_" + i2;

				switch ( i2 ) {
					case 0:
						if(axes > 0.1) {
							this.rabbitControl.movementSpeed = this.controlMovementSpeed * axes;
							this.rabbitControl.moveLeft = false;
							this.rabbitControl.moveRight = true;
							this.gamepadAxesPressed[pressedIndex] = true;
						} else if (axes < -0.1) {
							this.rabbitControl.movementSpeed = this.controlMovementSpeed * - axes;
							this.rabbitControl.moveLeft = true;
							this.rabbitControl.moveRight = false;
							this.gamepadAxesPressed[pressedIndex] = true;
						} else {
							if(this.gamepadAxesPressed[pressedIndex]) {
								this.rabbitControl.movementSpeed = this.controlMovementSpeed;
								this.rabbitControl.moveLeft = false;
								this.rabbitControl.moveRight = false;
								this.gamepadAxesPressed[pressedIndex] = false;
							}
						}
						break;
					case 1:
						if(axes > 0.1) {
							this.rabbitControl.movementSpeed = this.controlMovementSpeed * axes;
							this.rabbitControl.moveForward = false;
							this.rabbitControl.moveBackward = true;
							this.gamepadAxesPressed[pressedIndex] = true;
						} else if (axes < -0.1) {
							this.rabbitControl.movementSpeed = this.controlMovementSpeed * - axes;
							this.rabbitControl.moveForward = true;
							this.rabbitControl.moveBackward = false;
							this.gamepadAxesPressed[pressedIndex] = true;
						} else {
							if(this.gamepadAxesPressed[pressedIndex]) {
								this.rabbitControl.movementSpeed = this.controlMovementSpeed;
								this.rabbitControl.moveForward = false;
								this.rabbitControl.moveBackward = false;
								this.gamepadAxesPressed[pressedIndex] = false;
							}
						}
						break;
					case 2:
						if(axes > 0.1) {
							this.rabbitControl.mouseX = Math.round(200 * axes)
							this.gamepadAxesPressed[pressedIndex] = true;
						} else if (axes < -0.1) {
							this.rabbitControl.mouseX = Math.round(200 * axes)
							this.gamepadAxesPressed[pressedIndex] = true;
						} else {
							if(this.gamepadAxesPressed[pressedIndex]) {
								rabbitControl.mouseX = 0
								this.gamepadAxesPressed[pressedIndex] = false;
							}
						}
						break;
					case 3:
						if(axes > 0.1) {
							this.rabbitControl.mouseY = Math.round(200 * axes)
							this.gamepadAxesPressed[pressedIndex] = true;
						} else if (axes < -0.1) {
							this.rabbitControl.mouseY = Math.round(200 * axes)
							this.gamepadAxesPressed[pressedIndex] = true;
						} else {
							if(this.gamepadAxesPressed[pressedIndex]) {
								rabbitControl.mouseY = 0
								this.gamepadAxesPressed[pressedIndex] = false;;
							}
						}
						break;
				}

				if(this.gamepadAxesPressed[pressedIndex]) {
					somethingPressed = true;
				}
			}

			for (var i3 = 0; i3 < controller.buttons.length; i3++) {
				var button = controller.buttons[i3];
				var pressedIndex = i + "_" + i3;

				var buttonPress = (button == 1.0);

				if(typeof(button) == 'object') {
					buttonPress = button.pressed;
				}

				switch(i3) {
					case 0:
						if(buttonPress) {
							(this.rabbitControl.isMovingCamera) ? this.rabbitControl.moveUp = true : this.rabbitControl.objectJump = true;
							this.gamepadButtonsPressed[pressedIndex] = true;
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								if (this.rabbitControl.isMovingCamera) { this.rabbitControl.moveUp = false; }
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}
						break;
					case 1:
						if(buttonPress) {
							(this.rabbitControl.isMovingCamera) ? this.rabbitControl.moveDown = true : this.rabbitControl.objectDuck = true;
							this.gamepadButtonsPressed[pressedIndex] = true;
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								(this.rabbitControl.isMovingCamera) ? this.rabbitControl.moveDown = false : this.rabbitControl.objectDuck = false;
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}

						break;
					case 2:
						if(buttonPress) {
							if(!this.gamepadButtonsPressed[pressedIndex]) {
								if(typeof this.uiToggleEmbedChat !== 'undefined') {
									this.uiToggleEmbedChat();
									this.gamepadButtonsPressed[pressedIndex] = true;
								}
							}
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}
                    case 3:
                        if(buttonPress) {
							if(!this.gamepadButtonsPressed[pressedIndex]) {
								if(this.rabbitControl.isMovingCamera) {
									this.cameraFollowObject.attach();
									this.rabbitControl.moveRabbit();
								} else {
									this.cameraFollowObject.detach();
									this.rabbitControl.moveCamera();
								}

								this.gamepadButtonsPressed[pressedIndex] = true;
							}
                        } else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								(this.rabbitControl.isMovingCamera) ? this.rabbitControl.moveDown = false : this.rabbitControl.objectDuck = false;
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
                        }

						break;
					case 4:
                        if(buttonPress) {
							if(!this.gamepadButtonsPressed[pressedIndex]) {
								this.controlMovementSpeed = this.controlMovementSpeedInitValue / 2;
								this.gamepadButtonsPressed[pressedIndex] = true;
							}
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.controlMovementSpeed = this.controlMovementSpeedInitValue;
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}
						break;
					case 5:
                        if(buttonPress) {
							if(!this.gamepadButtonsPressed[pressedIndex]) {
								this.controlMovementSpeed = this.controlMovementSpeedInitValue * 2;
								this.gamepadButtonsPressed[pressedIndex] = true;
							}
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.controlMovementSpeed = this.controlMovementSpeedInitValue;
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}
						break;
					case 6:
                        if(buttonPress) {
							if(this.gamepadButtonsHoldCount[pressedIndex] == 0) {
								this.embed.volumeDown();
								if(typeof this.uiShowVolume !== 'undefined') {
									this.uiShowVolume();
								}

								this.gamepadButtonsPressed[pressedIndex] = true;
								this.gamepadButtonsHoldCount[pressedIndex] = 10;
							} else {
								this.gamepadButtonsHoldCount[pressedIndex]--;
							}
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.gamepadButtonsPressed[pressedIndex] = false;
								this.gamepadButtonsHoldCount[pressedIndex] = 0;
							}
						}

						break;
					case 7:
                        if(buttonPress) {
							if(this.gamepadButtonsHoldCount[pressedIndex] == 0) {
								this.embed.volumeUp();
								if(typeof this.uiShowVolume !== 'undefined') {
									this.uiShowVolume();
								}

								this.gamepadButtonsPressed[pressedIndex] = true;
								this.gamepadButtonsHoldCount[pressedIndex] = 10;
							} else {
								this.gamepadButtonsHoldCount[pressedIndex]--;
							}
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.gamepadButtonsPressed[pressedIndex] = false;
								this.gamepadButtonsHoldCount[pressedIndex] = 0;
							}
						}

						break;
					case 8:
						if(buttonPress) {
							if(!this.gamepadButtonsPressed[pressedIndex]) {
								if(typeof this.uiToggleAll !== 'undefined') {
									this.uiToggleAll();
								}

								this.gamepadButtonsPressed[pressedIndex] = true;
							}
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}
						break
					case 9:
						if(buttonPress) {
							if(!this.gamepadButtonsPressed[pressedIndex]) {
								this.embed.toggleMute();
								if(typeof this.uiShowVolume !== 'undefined') {
									this.uiShowVolume();
								}

								this.gamepadButtonsPressed[pressedIndex] = true;
							}
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}
						break
					case 12:
                        if(buttonPress) {
							this.rabbitControl.moveForward = true;
							this.gamepadButtonsPressed[pressedIndex] = true;
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.rabbitControl.moveForward = false;
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}

						break;
					case 13:
                        if(buttonPress) {
							this.rabbitControl.moveBackward = true;
							this.gamepadButtonsPressed[pressedIndex] = true;
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.rabbitControl.moveBackward = false;
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}

						break;
					case 14:
                        if(buttonPress) {
							this.rabbitControl.moveLeft = true;
							this.gamepadButtonsPressed[pressedIndex] = true;
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.rabbitControl.moveLeft = false;
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}

						break;
					case 15:
                        if(buttonPress) {
							this.rabbitControl.moveRight = true;
							this.gamepadButtonsPressed[pressedIndex] = true;
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.rabbitControl.moveRight = false;
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}

						break;
				}

				if(this.gamepadButtonsPressed[pressedIndex]) {
					somethingPressed = true;
				}
			}
		}

		if(somethingPressed) {
			if(typeof this.uiHideFirstHelp !== 'undefined') {
				this.uiHideFirstHelp();
			}
		}
    }

	this.dispose = function () {

		window.removeEventListener( 'gamepadconnected', _onGamepadConnect, false );
        window.removeEventListener( 'gamepaddisconnected', _onGamepadDisconnect, false );

	};

	var _onGamepadConnect = bind( this, this.connect );
    var _onGamepadDisconnect = bind( this, this.disconnect );

	window.addEventListener( 'gamepadconnected', _onGamepadConnect, false );
	window.addEventListener( 'gamepaddisconnected', _onGamepadDisconnect, false );

	function bind(scope, fn) {
		return function () {
			fn.apply(scope, arguments);
		};
	}

};

export { GamepadController };