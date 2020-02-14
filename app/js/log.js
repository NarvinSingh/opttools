'use strict';

const log = (function () {
  const SUCCESS = 0;
  const INFO = 3;
  const WARNING = 6;
  const ERROR = 9;
  const DEBUG = 12;

  let msgs = [];
  let printLevel = 0;
  let defaultMsgLevel = SUCCESS;

  function setDefaultMsgLevel(level) {
    if (Number.isInteger(parseFloat(level))) {
      defaultMsgLevel = level;
    }
  }

  function setPrintLevel(level) {
    if (Number.isInteger(parseFloat(level))) {
      printLevel = level;
    }
  }

  function enablePrinting() {
    setPrintLevel(0);
  }

  function disablePrinting() {
    setPrintLevel(-1);
  }

  function print(msg, msgLevel) {
    msgLevel = msgLevel || defaultMsgLevel;
    addMsg(msg, msgLevel);

    if (printLevel >= 0 && msgLevel >= printLevel) {
      console.log(msg);
    }
  }

  function addMsg(msg, msgLevel) {
    msgs.push( {msg: msg, msgLevel: msgLevel } );
  }

  function getMsgCount() {
    return msgs.length;
  }

  function getMsg(index) {
    return Number.isInteger(parseFloat(index))
      && index >= 0
      && index < this.getMsgCount()
      ? msgs[index]
      : null;
  }

  function getMsgText(index) {
    let msg = this.getMsg(index);

    return msg !== null ? msg.msg : null;
  }

  function getMsgLevel(index) {
    let msg = this.getMsg(index);

    return msg !== null ? msg.msgLevel : null;
  }

  function reprint(iFirst, count) {
    let index;
    
    for (index = 0; index < count; index++) {
      console.log(this.getMsgText(iFirst + index));
    }
  }

  return {
    SUCCESS: SUCCESS,
    DEBUG: DEBUG,
    INFO: INFO,
    WARNING: WARNING,
    ERROR: ERROR,
    setDefaultMsgLevel: setDefaultMsgLevel,
    setPrintLevel: setPrintLevel,
    enablePrinting: enablePrinting,
    disablePrinting: disablePrinting,
    print: print,
    addMsg: addMsg,
    getMsgCount: getMsgCount,
    getMsg: getMsg,
    getMsgText: getMsgText,
    getMsgLevel: getMsgLevel,
    reprint: reprint
  }
}());