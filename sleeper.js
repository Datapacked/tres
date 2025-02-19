/**
 * 
 * @param {Number} n Number of milliseconds to sleep
 * @returns {void}
 */
function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

/**
 * 
 * @param {Number} n
 * @returns {void} 
 */
function sleep(n) {
    msleep(1000 * n);
}

module.exports.msleep = msleep;
module.exports.sleep = sleep;