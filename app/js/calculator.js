'use strict';

let dbgJson;

(function () {
  const calcInterval = 3000;
  const defaultStrikeCount = 13;

  let fromDateInput;
  let strikeCountSelect;
  let goButton;
  let listSection;
  let intervalId = null;
  let isPaused = false;
  let isRefreshing = false;

  function initDeltaGamma() {
    const nowDate = (new Date()).toISOString().substr(0, 10);

    document.getElementById('addSymbolButton')
      .addEventListener('watchlistAdd', handleWatchlistAddEvent);
    fromDateInput = document.getElementById('fromDateInput');
    fromDateInput.addEventListener('input', handleRefreshOptionChainEvent);
    strikeCountSelect = document.getElementById('strikeCountSelect');
    strikeCountSelect.addEventListener('input', handleRefreshOptionChainEvent);
    goButton = document.getElementById('goButton');
    goButton.addEventListener('click', handleGoButtonEvent);
    listSection = document.getElementById('listSection');
    watchlist.getList().forEach((symbol) => loadSymbol(symbol));
    auth.addAuthCallback(handleAuthNotification);
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
    elt.className = 'symbolVal';
    elt.innerHTML = symbol;
    underlyingDiv.appendChild(elt);

    elt = document.createElement('label');
    elt.id = `last-${symbol}-Label`;
    elt.className = 'last';
    elt.innerHTML = 'Last';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('div');
    elt.id = `lastVal-${symbol}-Div`;
    elt.className = 'lastVal';
    elt.innerHTML = '--';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('label');
    elt.id = `target-${symbol}-Label`;
    elt.className = 'target';
    elt.innerHTML = 'Target';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('input');
    elt.id = `targetVal-${symbol}-Input`;
    elt.className = 'targetVal';
    elt.addEventListener('keyup', handleUnderlyingTargetValInputEvent);
    underlyingDiv.appendChild(elt);

    elt = document.createElement('label');
    elt.id = `volm-${symbol}-Label`;
    elt.className = 'volm';
    elt.innerHTML = 'Volume';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('div');
    elt.id = `volmVal-${symbol}-Div`;
    elt.className = 'volmVal';
    elt.innerHTML = '--';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('label');
    elt.id = `exp-${symbol}-Label`;
    elt.className = 'exp';
    elt.innerHTML = 'Expiration';
    underlyingDiv.appendChild(elt);

    elt = document.createElement('div');
    elt.id = `expVal-${symbol}-Div`;
    elt.className = 'expVal';
    elt.innerHTML = '--';
    underlyingDiv.appendChild(elt);

    listSection.appendChild(listRowDiv);
  }

  function unloadSymbol(symbol) {
    const symbolDiv = document.getElementById(`listRow-${symbol}-Div`);

    if (symbolDiv === null) {
      log.print(`unloadSymbol: ${symbol} not loaded`, log.WARNING);
      
      return;
    }
 
    listSection.removeChild(symbolDiv);
  }

  function loadChain(symbol, chainData, last) {
    const strikes = [];

    let atmStrike = 0;

    // Sort the strike keys and find the ATM strike
    Object.keys(chainData).forEach((strike) => {
      let iStrike = 0;

      while(iStrike < strikes.length && strike < strikes[iStrike]) {
        iStrike++;
      }

      strikes.splice(iStrike, 0, strike);

      if (Math.abs(strike - last) < Math.abs(atmStrike - last)) {
        atmStrike = strike;
      }
    });

    const putCall = chainData[atmStrike][0].putCall;
    const type = putCall.substr(0, 1).toLowerCase();
    const listRowDiv = document.getElementById(`listRow-${symbol}-Div`);
    const sChainDivId = `sChain-${symbol}-Div`;
    const chainDivId = `${type}Chain-${symbol}-Div`;

    let sChainDiv = document.getElementById(sChainDivId);

    if (sChainDiv === null) {
      sChainDiv = document.createElement('div');
      sChainDiv.id = sChainDivId;
      sChainDiv.className = 'strike';
      listRowDiv.appendChild(sChainDiv);
    }

    let chainDiv = document.getElementById(chainDivId);

    if (chainDiv === null) {
      chainDiv = document.createElement('div');
      chainDiv.id = chainDivId;
      chainDiv.className = `chain ${type}`;
      listRowDiv.appendChild(chainDiv);
    }

    const optionDivs = Array.from(chainDiv.getElementsByClassName('option'));

    strikes.forEach((strike, index) => {
      const option = chainData[strike][0];
      const optionDivId = `${type}Option-${symbol}-${strike}-Div`;
      const strikeDivId = `strike-${symbol}-${strike}-Div`;
      const appendElts = [];
      
      let optionDiv = document.getElementById(optionDivId);
      let strikeDiv = document.getElementById(strikeDivId);

      // Insert the option at the correct spot in the chain
      if (optionDiv === null) {
        optionDiv = document.createElement('div');
        optionDiv.id = optionDivId;

        let prevOptionDiv = optionDivs.find((div) => strike > div.id.split('-')[2]) || null;

        chainDiv.insertBefore(optionDiv, prevOptionDiv);

        // Insert the strike at the correct spot in the chain
        if (strikeDiv === null) {
          strikeDiv = document.createElement('div');
          strikeDiv.id = strikeDivId;
          strikeDiv.innerHTML = parseFloat(strike);

          let prevStrikeDiv = prevOptionDiv && document.getElementById(
              `strike-${symbol}-${prevOptionDiv.id.split('-')[2]}-Div`
            )
            || null;

          sChainDiv.insertBefore(strikeDiv, prevStrikeDiv);
        }
      }

      // Clear any ITM, ATM, OTM, odd and even classes
      optionDiv.className = `subPanel ${type} option`;
      strikeDiv.className = 'option';

      // Fill in the option values
      let eltId = `${type}DeltaVal-${symbol}-${strike}-Div`;
      let elt = document.getElementById(eltId);

      if (elt == null) {
        elt = document.createElement('Div');
        elt.id = eltId;
        appendElts.push(elt);
      }

      elt.className = `deltaVal numeric${getUpDownClass(elt.innerHTML, option.delta)}`;
      elt.innerHTML = option.delta.toFixed(3);

      eltId = `${type}GammaVal-${symbol}-${strike}-Div`;
      elt = document.getElementById(eltId);

      if (elt === null) {
        elt = document.createElement('Div');
        elt.id = eltId;
        appendElts.push(elt);
      }

      elt.className = `gammaVal numeric${getUpDownClass(elt.innerHTML, option.gamma)}`;
      elt.innerHTML = option.gamma.toFixed(3);

      eltId = `${type}ThetaVal-${symbol}-${strike}-Div`;
      elt = document.getElementById(eltId);

      if (elt === null) {
        elt = document.createElement('Div');
        elt.id = eltId;
        appendElts.push(elt);
      }

      elt.className = `thetaVal numeric${getUpDownClass(elt.innerHTML, option.theta)}`;
      elt.innerHTML = option.theta.toFixed(3);

      eltId = `${type}VegaVal-${symbol}-${strike}-Div`;
      elt = document.getElementById(eltId);

      if (elt === null) {
        elt = document.createElement('Div');
        elt.id = eltId;
        appendElts.push(elt);
      }

      elt.className = `vegaVal numeric${getUpDownClass(elt.innerHTML, option.vega)}`;
      elt.innerHTML = option.vega.toFixed(3);

      eltId = `${type}MarkVal-${symbol}-${strike}-Div`;
      elt = document.getElementById(eltId);

      if (elt === null) {
        elt = document.createElement('Div');
        elt.id = eltId;
        appendElts.push(elt);
      }

      elt.className = `markVal numeric${getUpDownClass(elt.innerHTML, option.mark)}`;
      elt.innerHTML = option.mark.toFixed(2);

      eltId = `${type}TargetVal-${symbol}-${strike}-Input`;
      elt = document.getElementById(eltId);

      if (elt === null) {
        elt = document.createElement('Input');
        elt.id = eltId;
        elt.className = 'targetVal numeric';
        elt.addEventListener('keyup', handleOptionTargetValInputEvent);
        appendElts.push(elt);
      }

      appendElts.forEach((elt) => {
        optionDiv.appendChild(elt);
      })
    });

    // Remove option divs from the chain that are not in the data
    // If necessary, remove strike divs as well
    optionDivs.forEach((div) => {
      const strike = div.id.split('-')[2];
      const strikeDiv = document.getElementById(`strike-${symbol}-${strike}-Div`);

      if (!strikes.includes(strike)) {
        chainDiv.removeChild(div);
        strikeDiv && sChainDiv.removeChild(strikeDiv);
      }
    });

    // Add ITM, ATM, OTM and odd even classes
    strikes.forEach((strike, index) => {
      const optionDivId = `${type}Option-${symbol}-${strike}-Div`;
      const ioatm = strike > atmStrike
        ? type === 'c'
          ? 'itm'
          : 'otm'
        : strike < atmStrike
          ? type === 'c'
            ? 'otm'
            : 'itm'
          : 'atm';
      const oddEven = index % 2 ? 'odd' : 'even';

      let optionDiv = document.getElementById(optionDivId);

      optionDiv.className = optionDiv.className + ` ${ioatm} ${oddEven}`;
    });

    // Recalculate the chain v2 values if s2 is specified on the underlying
    const s2 = document.getElementById(`targetVal-${symbol}-Input`).value;

    if (!isNaN(s2) && s2 > 0) {
      calcChain(symbol, type, s2);
    }
  }

  function unloadChain(symbol, type) {
    const listRowDiv = document.getElementById(`listRow-${symbol}-Div`);
    const chainDiv = document.getElementById(`${type}Chain-${symbol}-Div`);

    listRowDiv && chainDiv && listRowDiv.removeChild(chainDiv);
  }

  function calcV2(s1, s2, v1, d, g) {
    return (v1 + (d * (s2 - s1)) + (.5 * g * (s2 - s1) * (s2 - s1)));
  }

  function calcS2(s1, v1, v2, d, g) {
    const a = .5 * g;
    const b = d - (g * s1);
    const c = (.5 * g * s1 * s1) - (d * s1) + v1 - v2;

    return (-b - Math.sqrt((b * b) - (4 * a * c))) / (2 * a);
  }

  function calcChain(symbol, type, s2) {
    const chainDiv = document.getElementById(`${type}Chain-${symbol}-Div`);
    const divs = Array.from(chainDiv.getElementsByClassName('option'));
    const s1 = parseFloat(document.getElementById(`lastVal-${symbol}-Div`).innerHTML);

    divs.forEach((div) => {
      if (s2 != 0) {
        const v1 = parseFloat(div.getElementsByClassName('markVal')[0].innerHTML);
        const d = parseFloat(div.getElementsByClassName('deltaVal')[0].innerHTML);
        const g = parseFloat(div.getElementsByClassName('gammaVal')[0].innerHTML);
        const v2 = calcV2(s1, s2, v1, d, g).toFixed(2);

        div.getElementsByClassName('targetVal')[0].value = v2;
      } else {
        div.getElementsByClassName('targetVal')[0].value = '';
      }
    });
  }

  function calcUnderlying(symbol, type, strike, v2) {
    let s2;

    if (v2 != 0) {
      const div = document.getElementById(`${type}Option-${symbol}-${strike}-Div`);
      const s1 = parseFloat(document.getElementById(`lastVal-${symbol}-Div`).innerHTML);
      const v1 = parseFloat(div.getElementsByClassName('markVal')[0].innerHTML);
      const d = parseFloat(div.getElementsByClassName('deltaVal')[0].innerHTML);
      const g = parseFloat(div.getElementsByClassName('gammaVal')[0].innerHTML);
      
      s2 = calcS2(s1, v1, v2, d, g).toFixed(2);
    } else {
      s2 = '';
    }

    document.getElementById(`targetVal-${symbol}-Input`).value = s2;
    calcChain(symbol, 'c', s2);
    calcChain(symbol, 'p', s2);
  }

  function getOptionChain(symbol, fromDate, strikeCount) {
    const uri = `https://api.tdameritrade.com/v1/marketdata/chains?symbol=${symbol}&includeQuotes=TRUE&strikeCount=${strikeCount}&fromDate=${fromDate}&toDate=${fromDate}`;
    const xhr = new XMLHttpRequest();
    
    xhr.onreadystatechange = function() {
      handleGetOptionChainResponse(xhr, symbol, fromDate, strikeCount);
    };
    xhr.open('GET', uri);
    xhr.setRequestHeader('Authorization', 'Bearer ' + auth.getToken());
    xhr.send();
  }

  function getOptionChains() {
    watchlist.getList().forEach((symbol) => {
      getOptionChain(symbol, fromDateInput.value, strikeCountSelect.value);
    });
  }

  function getUpDownClass(prevVal, newVal) {
    return prevVal > newVal
      ? ' up'
      : prevVal < newVal
        ? ' down'
        : '';
  }

  function handleGetOptionChainResponse(xhr, symbol, fromDate, strikeCount) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      log.print(
        `handleGetOptionChainResponse: xhr.readyState=${xhr.readyState} xhr.status=${xhr.status}`
      );

      const json = JSON.parse(xhr.responseText);

      dbgJson = json;

      if (json.status == 'SUCCESS') {
        const underlying = json.underlying;
        const last = underlying !== null && underlying.last !== null
          ? underlying.last.toFixed(2).toLocaleString()
          : 'N/A';
        const volm = underlying.totalVolume !== null
          ? underlying.totalVolume.toLocaleString()
          : 'N/A';
        const expKey = Object.keys(json.callExpDateMap)[0];
        const callChain = json.callExpDateMap[expKey];
        const putChain = json.putExpDateMap[expKey];
        const keyParts = expKey.split(':');
        const dtExp = new Date(`${keyParts[0]} 00:00:00`);
        const dte = keyParts[1];
        const exp = dtExp.toLocaleDateString(
          'en-US',
          { month: 'short', day: 'numeric', year: 'numeric' }
        );
        const lastDiv = document.getElementById(`lastVal-${symbol}-Div`);

        lastDiv.className = `lastVal${getUpDownClass(lastDiv.innerHTML, last)}`;
        lastDiv.innerHTML = last;
        document.getElementById(`volmVal-${symbol}-Div`).innerHTML = volm;
        document.getElementById(`expVal-${symbol}-Div`).innerHTML = `${exp} (${dte})`;

        loadChain(symbol, callChain, last);
        loadChain(symbol, putChain, last);
      } else {
        log.print(`handleGetOptionChainResponse: json.status=${json.status}`, log.ERROR);
        unloadChain(symbol, 'p');
        unloadChain(symbol, 'c');
      }
    } else if (xhr.readyState == 4 && xhr.status == 401) {
      log.print(
        `handleGetOptionChainResponse: xhr.readyState=${xhr.readyState}  xhr.status=${xhr.status}`,
        log.WARNING
      );
      auth.setIsUnauthorized(true);
    } else if (xhr.readyState == 4) {
      log.print(
        `handleGetOptionChainResponse: xhr.readyState=${xhr.readyState}  xhr.status=${xhr.status}`,
        log.ERROR
      );
    }
  }

  function handleWatchlistAddEvent(e) {
    const symbol = e.detail;

    loadSymbol(symbol);

    if (intervalId !== null) {
      getOptionChain(symbol, fromDateInput.value, strikeCountSelect.value);
    }
  }

  function handleRefreshOptionChainEvent() {
    if (intervalId !== null) {
      getOptionChains();
    }
  }

  function handleGoButtonEvent() {
    this.blur();

    if (isPaused) {
      return;
    }

    if (intervalId === null) {
      goButton.className = 'icon last stop';
      getOptionChains();
      intervalId = setInterval(getOptionChains, calcInterval);
    } else {
      goButton.className = 'icon last go';
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function handleDeleteSymbolButtonEvent(event) {
    const symbol = event.currentTarget.id.split('-')[1];

    unloadSymbol(symbol);
    watchlist.deleteSymbol(symbol);
  }

  function handleUnderlyingTargetValInputEvent() {
    if (event.keyCode !== 13) {
      return;
    }

    const targetVal = this.value;

    if (isNaN(targetVal)) {
      log.print(`handleUnderlyingTargetValInputEvent: ${targetVal} is not a number`, log.WARNING);

      return;
    }

    const idParts = this.id.split('-');

    calcChain(idParts[1], 'c', targetVal);
    calcChain(idParts[1], 'p', targetVal);
  }

  function handleOptionTargetValInputEvent() {
    if (event.keyCode !== 13) {
      return;
    }

    const targetVal = this.value || 0;

    if (isNaN(targetVal)) {
      log.print(`handleOptionTargetValInputEvent: ${this.value} is not a number`, log.WARNING);

      return;
    }

    const idParts = this.id.split('-');

    calcUnderlying(idParts[1], idParts[0].substr(0, 1), idParts[2], targetVal);
  }

  function handleAuthNotification(isAuthorized) {
    log.print(`handleAuthNotification: isAuthorized=${isAuthorized} isPaused=${isPaused} isRefreshing=${isRefreshing}`);

    if (isAuthorized) {
      if (isPaused) {
        goButton.className = 'icon last stop';
        getOptionChains();
        intervalId = setInterval(getOptionChains, calcInterval);
        isPaused = false;
      }

      isRefreshing = false;
    } else {
      if (intervalId !== null) {
        goButton.className = 'icon last pause';
        clearInterval(intervalId);
        intervalId = null;
        isPaused = true;
      }

      if (!isRefreshing) {
        isRefreshing = true;
        auth.refreshToken();
      }
    }
  }

  window.addEventListener('load', initDeltaGamma);
}());