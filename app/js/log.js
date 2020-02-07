var log = (function () {
  const SUCCESS = 0;
  const DEBUG = 1;
  const INFO = 2;
  const WARNING = 3;
  const ERROR = 6;

  var msgs = [];
  var printLevel = 0;
  var defaultMsgLevel = SUCCESS;

  return {
    SUCCESS: SUCCESS,
    DEBUG: DEBUG,
    INFO: INFO,
    WARNING: WARNING,
    ERROR: ERROR,

    setDefaultMsgLevel: function(level) {
      if(Number.isInteger(parseFloat(level))) {
        defaultMsgLevel = level;
      }
    },

    setPrintLevel: function(level) {
      if(Number.isInteger(parseFloat(level))) {
        printLevel = level;
      }
    },

    enablePrinting: function() {
      this.setPrintLevel(0);
    },

    disablePrinting: function() {
      this.setPrintLevel(-1);
    },

    print: function(msg, msgLevel) {
      msgLevel = msgLevel || defaultMsgLevel;
      this.addMsg(msg, msgLevel);

      if(printLevel >= 0 && msgLevel >= printLevel) {
        console.log(msg);
      }
    },

    addMsg: function(msg, msgLevel) {
      msgs.push( {msg: msg, msgLevel: msgLevel } );
    },

    getMsgCount: function() {
      return msgs.length;
    },

    getMsg: function(index) {
      return Number.isInteger(parseFloat(index)) && index >= 0 && index < this.getMsgCount() ? msgs[index] : null;
    },

    getMsgText: function(index) {
      var msg = this.getMsg(index);
      return msg !== null ? msg.msg : null;
    },

    getMsgLevel: function(index) {
      var msg = this.getMsg(index);
      return msg !== null ? msg.msgLevel : null;
    },

    reprint: function(iFirst, count) {
      var i;
      
      for(i = 0; i < count; i++) {
        console.log(this.getMsgText(iFirst + i) + " (" + this.getMsgLevel(iFirst + i) + ")");
      }
    }
  }
})();