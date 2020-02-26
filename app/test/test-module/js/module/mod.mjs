import L from './logger.mjs';

const assertStyle = 'font-weight: bold; color: red';
const debugStyle = 'font-size: larger; font-weight: bold; color: #555;';
const informStyle = 'font-style: italic;';
const l = new L(true, assertStyle, debugStyle, informStyle);

let i = 0;

l.debug('Mod before class definition');

export default class Mod {
  constructor() {
    i++;
    l.debug(`Mod: ${i}`);
  }
}