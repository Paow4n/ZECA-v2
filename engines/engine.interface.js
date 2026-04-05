class Engine {
    /** @param {object} cfg */
    constructor(cfg = {}) { this.cfg = cfg; }

    /** Init engine 
     * @param {string} ua 
     */
    async start(ua) {}

    /** Post message
     * @param {string} message
     * @param {number|string} value
     * @param {string} txid
     */
    async post(message, value, txid) {}
}

module.exports = Engine;