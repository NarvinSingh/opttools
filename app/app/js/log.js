"use strict";

const log = (function () {
  const SUCCESS = 0;
  const DEBUG = 1;
  const INFO = 2;
  const WARNING = 3;
  const ERROR = 6;

  let msgs = [];
  let printLevel = 0;
  let defaultMsgLevel = SUCCESS;

  return {
    SUCCESS: SUCCESS,
    DEBUG: DEBUG,
    INFO: INFO,
    WARNING: WARNING,
    ERROR: ERROR,

    setDefaultMsgLevel(level) {
      if (Number.isInteger(parseFloat(level))) {
        defaultMsgLevel = level;
      }
    },

    setPrintLevel(level) {
      if (Number.isInteger(parseFloat(level))) {
        printLevel = level;
      }
    },

    enablePrinting() {
      this.setPrintLevel(0);
    },

    disablePrinting() {
      this.setPrintLevel(-1);
    },

    print(msg, msgLevel) {
      msgLevel = msgLevel || defaultMsgLevel;
      this.addMsg(msg, msgLevel);

      if (printLevel >= 0 && msgLevel >= printLevel) {
        console.log(msg);
      }
    },

    addMsg(msg, msgLevel) {
      msgs.push( {msg: msg, msgLevel: msgLevel } );
    },

    getMsgCount() {
      return msgs.length;
    },

    getMsg(index) {
      return Number.isInteger(parseFloat(index))
        && index >= 0
        && index < this.getMsgCount() ? msgs[index] : null;
    },

    getMsgText(index) {
      let msg = this.getMsg(index);

      return msg !== null ? msg.msg : null;
    },

    getMsgLevel(index) {
      let msg = this.getMsg(index);

      return msg !== null ? msg.msgLevel : null;
    },

    reprint(iFirst, count) {
      let i;
      
      for (i = 0; i < count; i++) {
        console.log(this.getMsgText(iFirst + i));
      }
    }
  }
}());