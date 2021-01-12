import {
	Object3D, Vector3,
} from "../three.module.js";

var CameraFollowRabbit = function ( camera, rabbit ) {

    this.camera = camera;
    this.rabbit = rabbit;

    // Rabbit Stuff Cache
    this.currentRabbitSize = this.rabbit.size;
    this.currentZoomoutMultiplier = Math.ceil(this.currentRabbitSize / 2);

    this.objectToFollow = this.rabbit.object;

    this.cameraAttached = true;

    this.cameraWorldPosition = new Vector3(0, 0, 0)
    this.cameraLerp = new Vector3(0, this.currentZoomoutMultiplier * 50, this.currentZoomoutMultiplier * -140)
    this.cameraZoom = new Vector3(0, this.currentZoomoutMultiplier * 30, this.currentZoomoutMultiplier * -50)

    this.cameraIsLerp = false;

    this.objectCameraInitPosition = this.objectToFollow.position.clone();
    this.deltaCameraY = 0;
    this.limitCameraY = 2;

    this.object = new Object3D();

    // Look At
    this.objectCameraLookAt = new Object3D();
    this.objectCameraLookAt.position.set(0, this.currentZoomoutMultiplier * 50, this.currentZoomoutMultiplier * 100);
    this.object.add(this.objectCameraLookAt);

    // Camera Detection
    this.objectCameraDetection = new Object3D();
    this.objectCameraDetection.position.set(0, this.currentZoomoutMultiplier * 50, this.currentZoomoutMultiplier * -140);
    this.objectCameraDetection.lookAt(this.objectCameraLookAt.position);

    this.object.add(this.objectCameraDetection);

    // Real Camera
    this.object.add(this.camera);
    this.camera.position.set(0, 50, -140);
    this.camera.lookAt(this.objectCameraLookAt.position);

    this.object.position.set(this.objectCameraInitPosition);
    this.object.rotation.set(this.objectToFollow.rotation);

    this.attach = function() {
        if(this.cameraAttached) {
            return;
        }

        this.object.position.set(0, 0, 0);
        this.object.lookAt(0, 0, 1);

        this.object.add(this.camera);
        this.camera.position.set(0, (this.currentZoomoutMultiplier * 50), (this.currentZoomoutMultiplier * -140));
        this.camera.lookAt(this.objectCameraLookAt.position);

        this.object.position.set(this.objectToFollow.position);
        this.object.rotation.set(this.objectToFollow.rotation);

        this.cameraAttached = true;
        this.cameraIsLerp = true; // IDK this hacks works
    }

    this.detach = function() {
        if(!this.cameraAttached) {
            return;
        }

        this.cameraAttached = false;

        this.object.remove(this.camera);
        this.camera.position.set(2000, 500, -1500);
    }

    this.update = function() {
        if(!this.cameraAttached) {
            return;
        }

        if(this.currentRabbitSize != this.rabbit.size) {
            this.currentRabbitSize = this.rabbit.size;
            this.currentZoomoutMultiplier = Math.ceil(this.currentRabbitSize / 2);

            this.objectCameraLookAt.position.z = this.currentZoomoutMultiplier * 100;
            this.objectCameraLookAt.position.y = this.currentZoomoutMultiplier * 50;
            this.objectCameraDetection.position.z = this.currentZoomoutMultiplier * -140;
            this.objectCameraDetection.position.y = this.currentZoomoutMultiplier * 50;
            this.cameraLerp.z = this.currentZoomoutMultiplier * -140;
            this.cameraLerp.y = this.currentZoomoutMultiplier * 50;
            this.cameraZoom.z = this.currentZoomoutMultiplier * -50;
            this.cameraZoom.y = this.currentZoomoutMultiplier * 30;

            this.detach();
            this.attach();
        }

        var posY = this.objectCameraInitPosition.y;

        if(this.rabbit.canFly) {
            posY = this.objectCameraInitPosition.y = this.objectToFollow.position.y;
        }

        this.object.position.set(this.objectToFollow.position.x, posY, this.objectToFollow.position.z);
        this.object.rotation.set(this.objectToFollow.rotation.x, this.objectToFollow.rotation.y, this.objectToFollow.rotation.z, this.objectToFollow.rotation.order);

        this.objectCameraDetection.getWorldPosition(this.cameraWorldPosition);

        if (this.cameraWorldPosition.y <= this.limitCameraY) {

            if ( !this.cameraLerp.equals(this.cameraZoom) ) {

                this.cameraLerp.set( this.cameraZoom.x, this.cameraZoom.y, this.cameraZoom.z );
                this.cameraIsLerp = true;

            }

        } else if ( !this.camera.position.equals(this.objectCameraDetection.position) ) {

            if ( !this.cameraLerp.equals(this.objectCameraDetection.position) ) {

                this.cameraLerp.set( this.objectCameraDetection.position.x, this.objectCameraDetection.position.y, this.objectCameraDetection.position.z );
                this.cameraIsLerp = true;

            }

        }

        if( this.cameraIsLerp ) {
            if( Math.round(this.camera.position.x) == Math.round(this.cameraLerp.x)
            && Math.round(this.camera.position.y) == Math.round(this.cameraLerp.y)
            && Math.round(this.camera.position.z) == Math.round(this.cameraLerp.z)) {

                this.cameraIsLerp = false;
                this.camera.position.set(this.cameraLerp.x, this.cameraLerp.y, this.cameraLerp.z);

            } else {

                this.camera.position.lerp( this.cameraLerp, 0.1 );

            }
        }
    };

};

export { CameraFollowRabbit };