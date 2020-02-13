'use strict';

let dbgJson;

(function () {
  const calcInterval = 15000;
  const defaultStrikeCount = 13;

  let addSymbolInput;
  let addSymbolButton;
  let fromDateInput;
  let strikeCountSelect;
  let calcButton;
  let listSection;
  let intervalId = null;
  let isPaused = false;
  let isRefreshing = false;
  let isStale = false;

  function initCalc() {
    const nowDate = (new Date()).toISOString().substr(0, 10);

    addSymbolInput = document.getElementById('addSymbolInput');
    addSymbolInput.addEventListener('keyup', handleAddSymbolInputEvent);
    addSymbolButton = document.getElementById('addSymbolButton')
    addSymbolButton.addEventListener('click', handleAddSymbolButtonEvent);
    fromDateInput = document.getElementById('fromDateInput');
    fromDateInput.addEventListener('input', handleFromDateInputEvent);
    strikeCountSelect = document.getElementById('strikeCountSelect');
    strikeCountSelect.addEventListener('input', handleSelectStrikeCountEvent);
    fromDateInput.value = localStorage.getItem('calc-fromDate') || nowDate;
    strikeCountSelect.value = localStorage.getItem('calc-strikeCount') || defaultStrikeCount;
    calcButton = document.getElementById('calcButton');
    calcButton.addEventListener('click', handleCalcButtonEvent);
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
    elt.addEventListener('keyup', handleTargetValueInputEvent);
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

  function clearChains() {
    watchlist.getList().forEach((symbol) => {
      let rowDiv = document.getElementById(`listRow-${symbol}-Div`);
      let chainDiv = document.getElementById(`chain-${symbol}-Div`);

      if (rowDiv && chainDiv) {
        rowDiv.removeChild(chainDiv);
      }
    });
  }

  function calc() {
    if (isStale) {
      clearChains();
      isStale = false;
    }

    watchlist.getList().forEach((symbol) => {
      getOptionChain(symbol, fromDateInput.value, strikeCountSelect.value);
    });
  }

  function calcChain(symbol, target) {
    const chainDiv = document.getElementById(`chain-${Symbol}-Div`);
    const divs = chainDiv.getElementsByClassName('option');

    log.print(`calcChain: symbol=${symbol} target=${target}`, log.DEBUG);
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
    log.print('getOptionChain: ' + uri);
  }

  function handleGetOptionChainResponse(xhr, symbol, fromDate, strikeCount) {
    if (xhr.readyState == 4 && xhr.status == 200) {
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

        document.getElementById(`lastValue-${symbol}-Div`).innerHTML = last;
        document.getElementById(`volmValue-${symbol}-Div`).innerHTML = volm;
        document.getElementById(`expValue-${symbol}-Div`).innerHTML = `${exp} (${dte})`;

        const listRowDiv = document.getElementById(`listRow-${symbol}-Div`);
        const chainDivId = `chain-${symbol}-Div`;

        let chainDiv = document.getElementById(chainDivId);

        if (chainDiv === null) {
          chainDiv = document.createElement('div');
          chainDiv.id = chainDivId;
          chainDiv.className = 'chain';
          listRowDiv.appendChild(chainDiv);
        }

        const strikes = [];

        let fAtmStrike = 0;
        let atmStrike;

        Object.keys(putChain).forEach((shortStrike) => {
          let fShortStrike = parseFloat(shortStrike);
          let iStrike = 0;

          while(iStrike < strikes.length && fShortStrike < parseFloat(strikes[iStrike])) {
            iStrike++;
          }

          strikes.splice(iStrike, 0, shortStrike);

          if (Math.abs(fShortStrike - last) < Math.abs(fAtmStrike - last)) {
            fAtmStrike = fShortStrike;
            atmStrike = shortStrike;
          }
        });

        log.print(`ATM Strike: ${atmStrike}`);

        strikes.forEach((shortStrike, index) => {
          const fShortStrike = parseFloat(shortStrike);
          const shortOption = putChain[shortStrike][0];
          const optionDivId = `option-${symbol}-${shortStrike}-Div`;
          const appendElts = [];
          
          let optionDiv = document.getElementById(optionDivId);

          if (optionDiv === null) {
            const ioatm = fShortStrike > fAtmStrike
              ? 'itm'
              : fShortStrike < fAtmStrike
                ? 'otm'
                : 'atm';
            const oddEven = index % 2 ? 'odd' : 'even';
            
            optionDiv = document.createElement('div');
            optionDiv.id = optionDivId;
            optionDiv.className = `subPanel option ${ioatm} ${oddEven}`;
            chainDiv.appendChild(optionDiv);
          }

          let eltId = `stratValue-${symbol}-${shortStrike}-Div`;
          let elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement('Div');
            elt.id = eltId;
            elt.className = 'stratValue';
            appendElts.push(elt);
          }

          elt.innerHTML = 'Naked or Covered Put';

          eltId = `strikeValue-${symbol}-${shortStrike}-Div`;
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement('Div');
            elt.id = eltId;
            elt.className = 'strikeValue text';
            appendElts.push(elt);
          }

          elt.innerHTML = fShortStrike;

          eltId = `deltaValue-${symbol}-${shortStrike}-Div`;
          elt = document.getElementById(eltId);

          if (elt == null) {
            elt = document.createElement('Div');
            elt.id = eltId;
            elt.className = 'deltaValue numeric';
            appendElts.push(elt);
          }

          elt.innerHTML = shortOption.delta.toFixed(3);

          eltId = `gammaValue-${symbol}-${shortStrike}-Div`;
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement('Div');
            elt.id = eltId;
            elt.className = 'gammaValue numeric';
            appendElts.push(elt);
          }

          elt.innerHTML = shortOption.gamma.toFixed(3);

          eltId = `thetaValue-${symbol}-${shortStrike}-Div`;
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement('Div');
            elt.id = eltId;
            elt.className = 'thetaValue numeric';
            appendElts.push(elt);
          }

          elt.innerHTML = shortOption.theta.toFixed(3);

          eltId = `vegaValue-${symbol}-${shortStrike}-Div`;
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement('Div');
            elt.id = eltId;
            elt.className = 'vegaValue numeric';
            appendElts.push(elt);
          }

          elt.innerHTML = shortOption.vega.toFixed(3);

          eltId = `markValue-${symbol}-${shortStrike}-Div`;
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement('Div');
            elt.id = eltId;
            elt.className = 'markValue numeric';
            appendElts.push(elt);
          }

          elt.innerHTML = shortOption.mark.toFixed(2);

          eltId = `targetValue-${symbol}-${shortStrike}-Input`;
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement('Input');
            elt.id = eltId;
            elt.className = 'targetValue numeric';
            appendElts.push(elt);
          }

          appendElts.forEach((elt) => {
            optionDiv.appendChild(elt);
          })
        });
        log.print(`handleGetOptionChainResponse: json.status=${json.status}`);
      } else {
        log.print(`handleGetOptionChainResponse: json.status=${json.status}`, log.ERROR);
      }
    } else if (xhr.readyState == 4 && xhr.status == 401) {
      log.print(
        `handleGetOptionChainResponse: xhr.readyState=${xhr.readyState}  xhr.status=${xhr.status}`
      );
      auth.setIsUnauthorized(true);
    } else {
      log.print(
        `handleGetOptionChainResponse: xhr.readyState=${xhr.readyState}  xhr.status=${xhr.status}`,
        log.ERROR
      );
    }
  }

  function handleAddSymbolInputEvent(event) {
    if (event.keyCode === 13) {
      addSymbolButton.click();
    }
  }

  function handleAddSymbolButtonEvent() {
    const symbol = addSymbolInput.value;

    watchlist.addSymbol(symbol);
    loadSymbol(symbol);
    addSymbolInput.value = '';

    if (intervalId !== null) {
      getOptionChain(symbol, fromDateInput.value, strikeCountSelect.value);
    }
  }

  function handleDeleteSymbolButtonEvent(event) {
    const symbol = event.currentTarget.id.split('-')[1];

    unloadSymbol(symbol);
    watchlist.deleteSymbol(symbol);
  }

  function handleFromDateInputEvent() {
    localStorage.setItem('calc-fromDate', fromDateInput.value);

    if (intervalId !== null) {
      calc();
    }
  }

  function handleSelectStrikeCountEvent() {
    localStorage.setItem('calc-strikeCount', strikeCountSelect.value);

    if (intervalId !== null) {
      clearChains();
      calc();
    } else {
      isStale = true;
    }
  }

  function handleCalcButtonEvent() {
    if (isPaused) {
      log.print('handleCalcButtonEvent: calculation paused');

      return;
    }

    if (intervalId === null) {
      calcButton.className = 'icon stop';
      calc();
      intervalId = setInterval(calc, calcInterval);
    } else {
      calcButton.className = 'icon go';
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function handleTargetValueInputEvent() {
    if (event.keyCode !== 13) {
      return;
    }

    const fTargetValue = parseFloat(this.value);

    if (isNaN(fTargetValue)) {
      log.print(`handleTargetValueInputEvent: ${this.value} is not a number`, log.WARNING);

      return;
    }

    calcChain(this.id.split('-')[1], fTargetValue);
  }

  function handleAuthNotification(isAuthorized) {
    log.print(`handleAuthNotification: isAuthorized=${isAuthorized} isPaused=${isPaused} isRefreshing=${isRefreshing}`);

    if (isAuthorized) {
      if (isPaused) {
        calcButton.className = 'icon stop';
        calc();
        intervalId = setInterval(calc, calcInterval);
        isPaused = false;
      }

      isRefreshing = false;
    } else {
      if (intervalId !== null) {
        calcButton.className = 'icon pause';
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

  window.addEventListener('load', initCalc);
}());