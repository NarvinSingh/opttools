import L from './module/logger.mjs';
import Mod from './module/mod.mjs';

const assertStyle = 'font-weight: bold; color: red';
const debugStyle = 'font-size: larger; font-weight: bold;';
const informStyle = 'font-style: italic;';
const l = new L(true, assertStyle, debugStyle, informStyle);

new Mod();
l.assert(1 === 1, '1 === 1');
l.assert(1 === '1', '1 === 1');
l.debug('debug with trace', debugStyle, true);
l.debug('debug without trace', debugStyle);
l.inform('inform');
l.warn('warn');
l.raise('raise');
l.isDebug = false;
l.informStyle = l.informStyle + 'font-weight: bold;';
l.raiseStyle = 'font-weight: bold;';
l.assert(1 === 1, '1 === 1');
l.assert(1 === '1', '1 === 1');
l.debug('debug with trace', '', true);
l.debug('debug without trace');
l.inform('inform');
l.warn('warn');
l.raise('raise');
new Mod();