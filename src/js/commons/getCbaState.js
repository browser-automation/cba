const {sendRpcMessage, addRpcListener, removeRpcListener} = require("../rpc/client");
/**
 * @typedef {import("../rpc/types").RpcHandler} RpcHandler
 */

/**
 * @returns {Promise<import("../background/CBA").State | null>}
 */
function getCbaState() {
  return new Promise((resolve) => {
    const uuid = uuidv4();
    const onTimeout = () => {
      removeRpcListener(handler);
      resolve(null);
    }
    /** @type {RpcHandler} */
    const handler = (state) => {
      if (state.msgType === "GetStateResponse" && state.id === uuid) {
        removeRpcListener(handler);
        resolve(state.state);
      }
      clearTimeout(onTimeout);
    };
    setTimeout(onTimeout, 1000);
    addRpcListener(handler);
    sendRpcMessage({msgType: "GetState", id: uuid});
  });
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

module.exports = getCbaState;
