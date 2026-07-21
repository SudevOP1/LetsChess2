const DEBUG = window.location.hostname === "localhost";

class Logger {
    constructor() {
        this.enabled = DEBUG;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    log(msg = "") {
        if (!this.enabled) {
            return;
        }
        console.log(msg);
    }

    debug(msg = "") {
        if (!this.enabled) {
            return;
        }
        console.log(`[DEBUG] ${msg}`);
    }

    error(msg = "") {
        if (!this.enabled) {
            return;
        }
        console.error(msg);
    }
}

export default new Logger();
