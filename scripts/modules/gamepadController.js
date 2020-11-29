var GamepadController = function () {
	this.rabbitSky;
	this.rabbit;
    this.rabbitControl;
	this.cameraFollowObject;
	this.embed;

	this.isReady = false;

	this.gamepadCount = 0;

	this.gamepadAxesPressed = {};
	this.gamepadAxesHoldCount = {};
	this.gamepadButtonsPressed = {};
	this.gamepadButtonsHoldCount = {};
	this.pressHelper = {};

	this.firstHelpRemoved = false;

	this.focusType;
	this.focusDom;
	this.focusTypeBeforePopup;
	this.focusDomBeforePopup;

	this.lastFocusClick = [];

	this.controlMovementSpeed;
	this.controlMovementSpeedInitValue;

	this.uiShowVolume;
	this.uiToggleEmbedChat;
	this.uiToggleUI;
	this.uiSliderHandler;

	this.animationID;

	this.init = function(rabbitSky) {
		this.rabbitSky = rabbitSky;
		this.rabbit = this.rabbitSky.mainRabbit;
		this.rabbitControl = this.rabbitSky.controls;
		this.cameraFollowObject = this.rabbitSky.cameraRabbit;
		this.embed = this.rabbitSky.embed;

		this.rabbitSky.gamepadControllerUpdate = _update;

		this.controlMovementSpeed = this.rabbitControl.movementSpeed;
		this.controlMovementSpeedInitValue = this.rabbitControl.movementSpeed;

		this.isReady = true;

		var allFocus = document.getElementsByClassName("gamepad-focus");
		for (var i = 0; i < allFocus.length; i++) {
			allFocus[i].tabIndex = "-1";
		}
	}

	this.hasGamepad = function() {
		if(!this.isReady) {
			return false;
		}

		if(this.gamepadCount <= 0) {
			return false;
		}

		return true;
	}

	this.connect = function( event ) {
		if(!this.isReady) {
			return;
		}

		this.gamepadCount++;

		for (var i2 = 0; i2 < event.gamepad.axes.length; i2++) {
			this.gamepadAxesPressed[event.gamepad.index + "_" + i2] = false;
			this.gamepadAxesHoldCount[event.gamepad.index + "_" + i2] = 0;
		}

		for (var i2 = 0; i2 < event.gamepad.buttons.length; i2++) {
			this.gamepadButtonsPressed[event.gamepad.index + "_" + i2] = false;
			this.gamepadButtonsHoldCount[event.gamepad.index + "_" + i2] = 0;
		}

		// Remove gamefirst info if showing
		if(!document.getElementById("game-first-info").classList.contains("none")) {
			document.getElementById("game-first-info").classList.add("none");
		}
	}

	this.disconnect = function( event ) {
		if(!this.isReady) {
			return;
		}

		this.gamepadCount--;

		for (var i2 = 0; i2 < event.gamepad.axes.length; i2++) {
			delete this.gamepadAxesPressed[event.gamepad.index + "_" + i2];
			delete this.gamepadAxesHoldCount[event.gamepad.index + "_" + i2];
		}

		for (var i2 = 0; i2 < event.gamepad.buttons.length; i2++) {
			delete this.gamepadButtonsPressed[event.gamepad.index + "_" + i2];
			delete this.gamepadButtonsHoldCount[event.gamepad.index + "_" + i2];
		}

		this.rabbitControl.movementSpeed = this.controlMovementSpeed;
		this.rabbitControl.resetVar();
	}

	this.changeFocus = function(type, obj) {
		if(!this.isReady) {
			return;
		}

		var tempFocusType = this.focusType;
		var tempFocusDom = this.focusDom;

		this.focusType = type;
		this.focusDom = obj;

		// If popup is closed, back to focused button for the sake of UX
		if(this.hasGamepad()) {
			if(this.focusType == "game") {
				this.firstHelpRemoved = false;
			} else {
				var focusDivs = this.focusDom.getElementsByClassName("gamepad-focus");
				if (focusDivs.length > 0) {
					focusDivs[0].focus();
				}
			}

			if(this.lastFocusClick.length > 0) {
				var lastArr = this.lastFocusClick[this.lastFocusClick.length - 1];
				if(this.focusDom.contains(lastArr)) {
					lastArr.focus();
					this.lastFocusClick.pop();
				}
			}
		}

		// If Click on Popup, save last object
		if(this.focusType == "popup" && typeof tempFocusType !== 'undefined' && tempFocusType != "popup") {
			this.focusTypeBeforePopup = tempFocusType;
			this.focusDomBeforePopup = tempFocusDom;
		}
	}

	this.refocus = function() {
		if(!this.isReady) {
			return;
		}

		this.changeFocus(this.focusType, this.focusDom);
	}

	this.popupCloseFocus = function() {
		if(!this.isReady) {
			return;
		}

		if(typeof this.focusTypeBeforePopup !== 'undefined' && typeof this.focusDomBeforePopup !== 'undefined') {
			this.changeFocus(this.focusTypeBeforePopup, this.focusDomBeforePopup);
		}
	}

	this.update = function() {
		if(!this.isReady) {
			return;
		}

		if(!this.hasGamepad()) {
			return;
		}

		switch(this.focusType) {
			case "popup":
			case "menu":
				this.updateInMenu();
				break;
			case "game":
				this.updateInGame();
				break;
		}
	}

	this.updateInMenu = function() {
		var pressUp = false;
		var pressDown = false;
		var pressLeft = false;
		var pressRight = false;
		var pressOK = false;
		var pressBack = false;
		var frameHold = 30;

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
							pressRight = true;
						} else if (axes < -0.1) {
							pressLeft = true;
						}
						break;
					case 1:
						if(this.gamepadAxesHoldCount[pressedIndex] == 0) {
							if(axes > 0.1) {
								pressDown = true;
								this.gamepadAxesHoldCount[pressedIndex] = frameHold;
							} else if (axes < -0.1) {
								pressUp = true;
								this.gamepadAxesHoldCount[pressedIndex] = frameHold;
							} else {
								this.gamepadAxesHoldCount[pressedIndex] = 0;
							}
						} else {
							this.gamepadAxesHoldCount[pressedIndex]--;
						}
						break;
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
						if(buttonPress){
							if(!this.gamepadButtonsPressed[pressedIndex]) {
								pressOK = true;
								this.gamepadButtonsPressed[pressedIndex] = true;
							}
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}

						break;
					case 1:
						if(buttonPress){
							if(!this.gamepadButtonsPressed[pressedIndex]) {
								pressBack = true;
								this.gamepadButtonsPressed[pressedIndex] = true;
							}
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}

						break;
					case 12:
						if(buttonPress){
							if(this.gamepadButtonsHoldCount[pressedIndex] == 0) {
								pressUp = true;
								this.gamepadButtonsHoldCount[pressedIndex] = frameHold;
							} else {
								this.gamepadButtonsHoldCount[pressedIndex]--;
							}
						} else {
							this.gamepadButtonsHoldCount[pressedIndex] = 0;
						}

						break;
					case 13:
						if(buttonPress){
							if(this.gamepadButtonsHoldCount[pressedIndex] == 0) {
								pressDown = true;
								this.gamepadButtonsHoldCount[pressedIndex] = frameHold;
							} else {
								this.gamepadButtonsHoldCount[pressedIndex]--;
							}
						} else {
							this.gamepadButtonsHoldCount[pressedIndex] = 0;
						}

						break;

					case 4:
					case 14:
						if(buttonPress){
							pressLeft = true;
						}

						break;

					case 5:
					case 15:
						if(buttonPress){
							pressRight = true;
						}

						break;
				}
			}
		}

		if(pressOK) {
			var currFocus = document.activeElement;
			if(currFocus.classList.contains("gamepad-focus")){
				if(currFocus.classList.contains("gamepad-slider")) {
					pressDown = true;
				} else if(currFocus.classList.contains("gamepad-checkbox")) {
					currFocus.click();
					currFocus.focus();
				} else {
					if(currFocus.classList.contains("gamepad-trigger-popup")){
						this.lastFocusClick.push(currFocus);
					} else if (currFocus.classList.contains("gamepad-clear-push")) {
						this.lastFocusClick = [];
					}

					currFocus.click();
				}
			}
		}

		if(pressBack) {
			if(this.focusType == "popup") {
				var popupExit = this.focusDom.getElementsByClassName("popup-exit");
				if(popupExit.length > 0) {
					popupExit[0].click();
				}
			}
		}

		if(pressDown) {
			var gf = this.focusDom.getElementsByClassName("gamepad-focus");
			if(gf.length > 0) {
				var currFocus = document.activeElement;
				var currI = 0;

				if(currFocus.classList.contains("gamepad-focus")){
					for(var i = 0; i < gf.length; i++) {
						if(gf[i] === currFocus) {
							currI = i+1;
							break;
						}
					}

					if(currI >= gf.length) {
						currI = 0;
					}

					while(gf[currI].classList.contains("none") || gf[currI].classList.contains("disabled")) {
						currI++;
						if(currI >= gf.length) {
							currI = 0;
						}
					}
				}

				if(currI < gf.length) {
					gf[currI].focus();
				}
			}
		}

		if(pressUp) {
			var gf = this.focusDom.getElementsByClassName("gamepad-focus");
			if (gf.length > 0) {
				var currFocus = document.activeElement;
				var lastElement = gf.length - 1;
				var currI = lastElement;

				if(currFocus.classList.contains("gamepad-focus")){
					for(var i = lastElement; i >= 0; i--) {
						if(gf[i] === currFocus) {
							currI = i - 1;
							break;
						}
					}

					if(currI < 0) {
						currI = lastElement;
					}

					while(gf[currI].classList.contains("none") || gf[currI].classList.contains("disabled")) {
						currI--;
						if(currI < 0) {
							currI = lastElement;
						}
					}
				}

				if(currI < gf.length) {
					gf[currI].focus();
				}
			}
		}

		if(pressLeft) {
			var currFocus = document.activeElement;
			if(currFocus.classList.contains("gamepad-slider")) {
				var tagInput = currFocus.getElementsByTagName("input");
				if(tagInput.length > 0) {
					tagInput[0].value = parseInt(tagInput[0].value) - 1;
					if(typeof this.uiSliderHandler !== 'undefined') {
						this.uiSliderHandler();
					}
				}
			} else if (this.focusDom.classList.contains("gamepad-tab")) {
				if(typeof this.pressHelper["left"] === 'undefined' || !this.pressHelper["left"]) {
					var selected = 0;
					var tabOpts = this.focusDom.getElementsByClassName("gamepad-tab-option");
					for(var i = tabOpts.length-1; i >= 0; i--) {
						if(tabOpts[i].classList.contains("selected")) {
							selected = i-1;
							break;
						}
					}

					if(selected < 0) {
						selected = tabOpts.length-1;
					}

					tabOpts[selected].click();

					var findFocus = document.getElementById(tabOpts[selected].getAttribute("data-id")).getElementsByClassName("gamepad-focus");
					if(findFocus.length > 0) {
						findFocus[0].focus();
					}

					this.pressHelper["left"] = true;
				}
			}
		} else {
			if(typeof this.pressHelper["left"] !== 'undefined' && this.pressHelper["left"]) {
				this.pressHelper["left"] = false;
			}
		}

		if(pressRight) {
			var currFocus = document.activeElement;
			if(currFocus.classList.contains("gamepad-slider")) {
				var tagInput = currFocus.getElementsByTagName("input");
				if(tagInput.length > 0) {
					tagInput[0].value = parseInt(tagInput[0].value) + 1;
					if(typeof this.uiSliderHandler !== 'undefined') {
						this.uiSliderHandler();
					}
				}
			} else if (this.focusDom.classList.contains("gamepad-tab")) {
				if(typeof this.pressHelper["right"] === 'undefined' || !this.pressHelper["right"]) {
					var selected = 0;
					var tabOpts = this.focusDom.getElementsByClassName("gamepad-tab-option");
					for(var i = 0; i < tabOpts.length; i++) {
						if(tabOpts[i].classList.contains("selected")) {
							selected = i+1;
							break;
						}
					}

					if(selected >= tabOpts.length) {
						selected = 0;
					}

					tabOpts[selected].click();

					var findFocus = document.getElementById(tabOpts[selected].getAttribute("data-id")).getElementsByClassName("gamepad-focus");
					if(findFocus.length > 0) {
						findFocus[0].focus();
					}

					this.pressHelper["right"] = true;
				}
			}
		} else {
			if(typeof this.pressHelper["right"] !== 'undefined' && this.pressHelper["right"]) {
				this.pressHelper["right"] = false;
			}
		}
	}

	this.updateInGame = function() {
		if(!this.rabbitSky.isAnimating()) {
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
								this.rabbitControl.mouseX = 0
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
								this.rabbitControl.mouseY = 0
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
								if(typeof this.uiToggleEmbedChat !== 'undefined' && typeof this.uiToggleUI !== 'undefined') {
									this.uiToggleEmbedChat();
									this.uiToggleUI();
								}
								this.gamepadButtonsPressed[pressedIndex] = true;
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
							if(this.rabbit.canFly) {
								this.rabbitControl.moveDown = true;
							} else if(!this.gamepadButtonsPressed[pressedIndex]) {
								this.controlMovementSpeed = this.controlMovementSpeedInitValue / 2;
							}

							this.gamepadButtonsPressed[pressedIndex] = true;
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								if(this.rabbit.canFly) {
									this.rabbitControl.moveDown = false;
								} else {
									this.controlMovementSpeed = this.controlMovementSpeedInitValue;
								}
								this.gamepadButtonsPressed[pressedIndex] = false;
							}
						}
						break;
					case 5:
                        if(buttonPress) {
							if(this.rabbit.canFly) {
								this.rabbitControl.moveUp = true;
							} else if(!this.gamepadButtonsPressed[pressedIndex]) {
								this.controlMovementSpeed = this.controlMovementSpeedInitValue * 2;
							}

							this.gamepadButtonsPressed[pressedIndex] = true;
						} else {
							if(this.gamepadButtonsPressed[pressedIndex]) {
								if(this.rabbit.canFly) {
									this.rabbitControl.moveUp = false;
								} else {
									this.controlMovementSpeed = this.controlMovementSpeedInitValue;
								}
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
								if(this.embed.isPaused()) {
									this.embed.play();
									this.embed.unmute();
								} else {
									this.embed.toggleMute();
									if(typeof this.uiShowVolume !== 'undefined') {
										this.uiShowVolume();
									}
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
								document.getElementById("options-button").click();
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

		if(somethingPressed && !this.firstHelpRemoved) {
			if(!document.getElementById("game-first-info").classList.contains("none")) {
				document.getElementById("game-first-info").classList.add("none");
				this.firstHelpRemoved = true;
			}
		}
	}

	this.animate = function() {
        this.animationID = requestAnimationFrame( _animate );
        this.update();
	}

	this.startStandalone = function() {
		this.animate();
	}

	this.stopStandalone = function() {
		if(typeof this.animationID !== 'undefined') {
			cancelAnimationFrame(this.animationID);
			this.animationID = undefined;
		}
	}

	this.dispose = function () {
		window.removeEventListener( 'gamepadconnected', _onGamepadConnect, false );
        window.removeEventListener( 'gamepaddisconnected', _onGamepadDisconnect, false );
	};

	var _update = bind( this, this.update );
	var _animate = bind( this, this.animate );
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