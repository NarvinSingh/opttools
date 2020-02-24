'use strict';

(function () {
  const defaultStrikeCount = 13;

  let addSymbolInput;
  let addSymbolButton;
  let fromDateInput;
  let strikeCountSelect;

  function initWatchlistUI() {
    addSymbolInput = document.getElementById('addSymbolInput');
    addSymbolInput.addEventListener('keyup', handleAddSymbolInputEvent);
    addSymbolButton = document.getElementById('addSymbolButton')
    addSymbolButton.addEventListener('click', handleAddSymbolButtonEvent);
    fromDateInput = document.getElementById('fromDateInput');
    fromDateInput.addEventListener('input', handleFromDateInputEvent);
    fromDateInput.value = localStorage.getItem('watchlistUI-fromDate')
      || (new Date()).toISOString().substr(0, 10);
    strikeCountSelect = document.getElementById('strikeCountSelect');
    strikeCountSelect.addEventListener('input', handleSelectStrikeCountEvent);
    strikeCountSelect.value = localStorage.getItem('watchlistUI-strikeCount') || defaultStrikeCount;
  }

  function handleAddSymbolInputEvent(event) {
    if (event.keyCode === 13) {
      addSymbolButton.click();
    }
  }

  function handleAddSymbolButtonEvent() {
    const symbol = addSymbolInput.value;

    this.blur();
    addSymbolInput.value = '';
    watchlist.addSymbol(symbol);
    this.dispatchEvent(new CustomEvent('watchlistAdd', { detail: symbol }));
  }

  function handleFromDateInputEvent() {
    localStorage.setItem('watchlistUI-fromDate', this.value);
  }

  function handleSelectStrikeCountEvent() {
    localStorage.setItem('watchlistUI-strikeCount', this.value);
  }

  window.addEventListener('load', initWatchlistUI);
}());