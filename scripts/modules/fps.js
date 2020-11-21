var FPS = function (id) {
    this.prevTime = Date.now();
    this.frame = 0;
    this.enabled = false;
    this.domId = document.getElementById(id);

    this.update = function() {
        if(this.enabled){
            this.frame++;
            var time = Date.now();
            if ( time >= this.prevTime + 1000 ) {
                var fps = Math.floor(( this.frame * 1000 ) / ( time - this.prevTime ));
                this.domId.innerHTML = "FPS: " + fps;

                this.prevTime = time;
                this.frame = 0;
            }
        }
    };

    this.enable = function() {
        this.enabled = true;
        this.domId.style.display = "block";
        this.domId.innerHTML = "";

        this.beginTime = Date.now();
        this.prevTime = Date.now()
    }

    this.disable = function() {
        this.enabled = false;
        this.domId.style.display = "none";
        this.domId.innerHTML = "";
    }

    this.clear = function() {
        this.domId.innerHTML = "";
    }
}

export { FPS }