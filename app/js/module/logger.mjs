export default class Logger {
  constructor(
    isDebug = false,
    assertStyle = '',
    debugStyle = '',
    informStyle = '',
    warnStyle = '',
    raiseStyle = ''
  ) {
    this.isDebug = isDebug;
    this.assertStyle = assertStyle;
    this.debugStyle = debugStyle;
    this.informStyle = informStyle;
    this.warnStyle = warnStyle;
    this.raiseStyle = raiseStyle;
  }

  assert(isTrue, msg) {
    if (this.isDebug && isTrue) {
      console.debug(`%c${msg}`, this.assertStyle);
    }
  }
  
  debug(msg, isTrace = false) {
    if (this.isDebug) {
      console.debug(`%c${msg}`, this.debugStyle);

      if (isTrace) {
        console.trace();
      }
    }
  }

  inform(msg) {
    console.info(`%c${msg}`, this.informStyle);
  }

  warn(msg) {
    console.warn(`%c${msg}`, this.warnStyle);
  }

  raise(msg) {
    console.error(`%c${msg}`, this.raiseStyle);
  }
}