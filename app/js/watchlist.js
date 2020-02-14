'use strict';

const watchlist = (function () {
  let list;

  function initWatchlist() {
    list = (localStorage.getItem('watchlist-list') || '').split(',')
      .map((symbol) => symbol.trim())
      .filter((symbol) => symbol.length > 0);
  }

  function getList() {
    return list;
  }

  function hasSymbol(symbol) {
    return list.includes(symbol);
  }

  function addSymbol(symbol) {
    symbol = symbol.trim();

    if (symbol.length === 0) {
      log.print(`addSymbol: empty symbol not added to watchlist`, log.WARNING);
      
      return;
    }

    if (list.includes(symbol)) {
      log.print(`addSymbol: ${symbol} already in watchlist`, log.WARNING);
      
      return;
    }

    list.push(symbol);
    localStorage.setItem('watchlist-list', list.join(','));
  }

  function deleteSymbol(symbol) {
    symbol = symbol.trim();

    if (symbol.length === 0) {
      log.print(`deleteSymbol: empty symbol not deleted from watchlist`, log.WARNING);
      
      return;
    }

    const index = list.indexOf(symbol);

    if (index === -1) {
      log.print(`deleteSymbol: ${symbol} not in watchlist`, log.WARNING);
      
      return;
    }

    list.splice(index, 1);
    localStorage.setItem('watchlist-list', list.join(','));
  }

  window.addEventListener('load', initWatchlist);

  return {
    getList: getList,
    hasSymbol: hasSymbol,
    addSymbol: addSymbol,
    deleteSymbol: deleteSymbol
  }
}());