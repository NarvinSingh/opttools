'use strict';

const watchlistUI = (function () {
  let listSection;

  function initWatchlistUI() {
    listSection = document.getElementById('listSection');
    watchlist.getList().forEach((symbol) => loadSymbol(symbol));
  }

  function loadSymbol(symbol) {
    const listRowDivId = `listRow-${symbol}-Div`;
    
    let listRowDiv = document.getElementById(listRowDivId);

    if (listRowDiv !== null) {
      log.print(`loadSymbol: ${symbol} already loaded`, log.WARNING);

      return;
    }

    listRowDiv = document.createElement('div');
    listRowDiv.id = `listRow-${symbol}-Div`;
    listRowDiv.className = 'listRow';

    const underlyingDiv = document.createElement('div');
    underlyingDiv.id = `underlying-${symbol}-Div`;
    underlyingDiv.className = 'subPanel underlying';
    listRowDiv.appendChild(underlyingDiv);

    let elt = document.createElement('button');
    elt.id = `delete-${symbol}-Button`;
    elt.className = 'icon delete';
    elt.addEventListener('click', handleDeleteSymbolButtonEvent);
    underlyingDiv.appendChild(elt);

    elt = document.createElement('div');
    elt.id = `symbol-${symbol}-Div`;
    elt.className = 'symbolValue';
    elt.innerHTML = symbol;
    underlyingDiv.appendChild(elt);

    elt = document.createElement('label');
    elt.id = `last-${symbol}-Label`;
    elt.className = 'last';
    elt.innerHTML = 'Last';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('div');
    elt.id = `lastValue-${symbol}-Div`;
    elt.className = 'lastValue';
    elt.innerHTML = '--';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('label');
    elt.id = `target-${symbol}-Label`;
    elt.className = 'target';
    elt.innerHTML = 'Target';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('input');
    elt.id = `targetValue-${symbol}-Input`;
    elt.className = 'targetValue';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('label');
    elt.id = `volm-${symbol}-Label`;
    elt.className = 'volm';
    elt.innerHTML = 'Volume';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('div');
    elt.id = `volmValue-${symbol}-Div`;
    elt.className = 'volmValue';
    elt.innerHTML = '--';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('label');
    elt.id = `exp-${symbol}-Label`;
    elt.className = 'exp';
    elt.innerHTML = 'Expiration';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('div');
    elt.id = `expValue-${symbol}-Div`;
    elt.className = 'expValue';
    elt.innerHTML = '--';
    underlyingDiv.appendChild(elt);

    listSection.appendChild(listRowDiv);
    log.print(`loadSymbol: ${symbol} loaded`);
  }

  function unloadSymbol(symbol) {
    const symbolDiv = document.getElementById(`listRow-${symbol}-Div`);

    if (symbolDiv === null) {
      log.print(`unloadSymbol: ${symbol} not loaded`, log.WARNING);
      
      return;
    }
 
    listSection.removeChild(symbolDiv);
  }

  function handleDeleteSymbolButtonEvent(event) {
    const symbol = event.currentTarget.id.split('-')[1];

    unloadSymbol(symbol);
    watchlist.deleteSymbol(symbol);
  }

  window.addEventListener('load', initWatchlistUI);

  return {
    loadSymbol: loadSymbol,
    unloadSymbol: unloadSymbol
  }
}());