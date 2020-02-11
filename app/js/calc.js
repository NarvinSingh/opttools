'use strict';

let dbgJson;

(function () {
  const calcInterval = 15000;
  const defaultStrikeCount = 13;

  let addSymbolInput;
  let fromDateInput;
  let toDateInput;
  let strikeCountSelect;
  let calcButton;
  let intervalId = null;
  let isPaused = false;
  let isRefreshing = false;

  function initCalc() {
    const nowDate = (new Date()).toISOString().substr(0, 10);

    addSymbolInput = document.getElementById('addSymbolInput');
    document.getElementById('addSymbolButton').addEventListener(
      'click',
      handleButtonAddSymbolClick
    );
    fromDateInput = document.getElementById('fromDateInput');
    fromDateInput.addEventListener('input', handleInputFromDateInput);
    toDateInput = document.getElementById('toDateInput');
    toDateInput.addEventListener('input', handleInputToDateInput);
    strikeCountSelect = document.getElementById('strikeCountSelect');
    strikeCountSelect.addEventListener('input', handleSelectStrikeCountInput);
    fromDateInput.value = localStorage.getItem('calc-fromDate') || nowDate;
    toDateInput.value = localStorage.getItem('calc-toDate') || fromDateInput.value;
    strikeCountSelect.value = localStorage.getItem('calc-strikeCount') || defaultStrikeCount;
    calcButton = document.getElementById('calcButton');
    calcButton.addEventListener('click', handleButtonCalcClick);
    auth.addAuthCallback(handleAuthNotification);
  }

  function calc() {
    // if (!checkAuthAndRefresh()) {
    //   log.print('calc: checkAuthAndRefresh() failed', log.WARNING);
    //   stopCalcInterval();

    //   return;
    // }

    watchlist.getList().forEach((symbol) => {
      getOptionChain(symbol, fromDateInput.value, toDateInput.value, strikeCountSelect.value);
    });
  }

  function getOptionChain(symbol, fromDate, toDate, strikeCount) {
    // if (!checkAuthAndRefresh()) {
    //   log.print('getOptionChain: checkAuthAndRefresh() failed', log.WARNING);

    //   return;
    // }

    const uri = `https://api.tdameritrade.com/v1/marketdata/chains?symbol=${symbol}&includeQuotes=TRUE&strikeCount=${strikeCount}&fromDate=${fromDate}&toDate=${toDate}`;
    const xhr = new XMLHttpRequest();
    
    xhr.onreadystatechange = function() {
      handleGetOptionChainResponse(xhr, symbol, fromDate, toDate, strikeCount);
    };
    xhr.open('GET', uri);
    xhr.setRequestHeader('Authorization', 'Bearer ' + auth.getToken());
    xhr.send();
    log.print('getOptionChain: ' + uri);
  }

  function handleGetOptionChainResponse(xhr, symbol, fromDate, toDate, strikeCount) {
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

      // if (!checkAuthAndRefresh()) {
      //   log.print('handleGetOptionChainResponse: checkAuthAndRefresh() failed', log.WARNING);

      //   return;
      // }
      // log.print('handleGetOptionChainResponse: auth.refreshToken()', log.WARNING);
      // auth.refreshToken();
      // log.print('handleGetOptionChainResponse: getOptionChain()', log.WARNING);
      // getOptionChain(symbol, fromDate, toDate, strikeCount);
    } else {
      log.print(
        `handleGetOptionChainResponse: xhr.readyState=${xhr.readyState}  xhr.status=${xhr.status}`,
        log.ERROR
      );
    }
  }

  function handleButtonAddSymbolClick() {
    const symbol = addSymbolInput.value;

    watchlist.addSymbol(symbol);
    watchlistUI.loadSymbol(symbol);
    addSymbolInput.value = '';

    if (intervalId !== null) {
      getOptionChain(symbol, fromDateInput.value, toDateInput.value, strikeCountSelect.value);
    }
  }

  function handleInputFromDateInput() {
    localStorage.setItem('calc-fromDate', fromDateInput.value);
  }

  function handleInputToDateInput() {
    localStorage.setItem('calc-toDate', toDateInput.value);
  }

  function handleSelectStrikeCountInput() {
    localStorage.setItem('calc-strikeCount', strikeCountSelect.value);
  }

  function handleButtonCalcClick() {
    if (isPaused) {
      log.print('handleButtonCalcClick: calculation paused');

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

  function handleAuthNotification(isAuthorized) {
    log.print(`handleAuthNotification: isAuthorized=${isAuthorized} isPaused=${isPaused} isRefreshing=${isRefreshing}`);

    if (isAuthorized) {
      if (isPaused) {
        calcButton.className = 'icon stop';
        calc();
        intervalId = setInterval(calc, calcInterval);
      }

      isRefreshing = false;
    } else {
      if (intervalId !== null) {
        calcButton.className = 'icon go';
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

  // function checkAuthAndRefresh() {
  //   if (auth.getIsUnauthorized()) {
  //     log.print('checkAuthAndRefresh: unauthorized', log.WARNING);

  //     if (!isRefreshing) {
  //       isRefreshing = true;
  //       log.print('checkAuthAndRefresh: auth.refreshToken()', log.WARNING);
  //       auth.refreshToken();
  //     }
      
  //     return false;
  //   }

  //   isRefreshing = false;

  //   return true;
  // }

  // function startCalcInterval() {
  //   if (intervalId !== null) {
  //     log.print('startCalcInterval: calc already started.', log.WARNING);

  //     return;
  //   }

  //   calcButton.className = 'icon stop';
  //   calc();
  //   intervalId = setInterval(calc, calcInterval);
  // }

  // function stopCalcInterval() {
  //   calcButton.className = 'icon go';

  //   if (intervalId === null) {
  //     log.print('stopCalcInterval: calc already stopped.', log.WARNING);

  //     return;
  //   }

  //   clearInterval(intervalId);
  //   intervalId = null;
  // }
