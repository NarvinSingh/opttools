"use strict";

const calcInterval = 15000;
const defaultStrikeCount = 13;

let dbgJson;

(function () {
  let listSection;
  let addSymbolInput;
  let fromDateInput;
  let toDateInput;
  let strikeCountSelect;
  let watchlist;
  let intervalId = null;

  function initCalc() {
    const nowDate = (new Date()).toISOString().substr(0, 10);

    listSection = document.getElementById("listSection");
    addSymbolInput = document.getElementById("addSymbolInput");
    document.getElementById("addSymbolButton").addEventListener(
      "click", processButtonAddSymbolClick);
    fromDateInput = document.getElementById("fromDateInput");
    fromDateInput.addEventListener("input", processInputFromDateInput);
    toDateInput = document.getElementById("toDateInput");
    toDateInput.addEventListener("input", processInputToDateInput);
    strikeCountSelect = document.getElementById("strikeCountSelect");
    strikeCountSelect.addEventListener("input", processSelectStrikeCountInput);
    fromDateInput.value = localStorage.getItem("calc-fromDate") || nowDate;
    toDateInput.value = localStorage.getItem("calc-toDate") || fromDateInput.value;
    strikeCountSelect.value = localStorage.getItem("calc-strikeCount") || defaultStrikeCount;
    document.getElementById("calcButton").addEventListener("click", processButtonCalcClick);
    watchlist = localStorage.watchlist;

    if (watchlist) {      
      watchlist = watchlist.split(",");
      watchlist.forEach(loadSymbol);
    }
  }

  function processButtonAddSymbolClick() {
    addSymbol(addSymbolInput.value);
  }

  function processButtonDeleteSymbolClick(event) {
    deleteSymbol(event.currentTarget.id.split("-")[1]);
  }

  function processInputFromDateInput() {
    localStorage.setItem("calc-fromDate", fromDateInput.value);
  }

  function processInputToDateInput() {
    localStorage.setItem("calc-toDate", toDateInput.value);
  }

  function processSelectStrikeCountInput() {
    localStorage.setItem("calc-strikeCount", strikeCountSelect.value);
  }

  function processButtonCalcClick(event) {
    const elt = event.currentTarget;

    if (intervalId === null) {
      calc();
      intervalId = setInterval(calc, calcInterval);
      elt.className = "icon stop";
    } else {
      clearInterval(intervalId);
      intervalId = null;
      elt.className = "icon go";
    }
  }

  function addSymbol(symbol) {
    if (watchlist.indexOf(symbol) !== -1) {
      log.print("addSymbol: " + symbol + " already in watchlist", log.WARNING);
      return;
    }

    watchlist.push(symbol);
    localStorage.setItem("watchlist", watchlist.join(","));
    loadSymbol(symbol);
    getOptionChain(symbol, fromDateInput.value, toDateInput.value, strikeCountSelect.value);
    log.print("addSymbol: " + symbol + " added to watchlist");
  }

  function deleteSymbol(symbol) {
    const symbolDiv = document.getElementById("listRow-" + symbol + "-Div");

    if (symbolDiv === null) {
      log.print("deleteSymbol: " + symbol + " not in watchlist", log.WARNING);
      return;
    }
 
    listSection.removeChild(symbolDiv);
    watchlist.splice(watchlist.indexOf(symbol), 1);
    localStorage.setItem("watchlist", watchlist.join(","));
    log.print("deleteSymbol: " + symbol + " removed from watchlist");
  }

  function calc() {
    if (watchlist) {      
      watchlist.forEach((symbol) => {
        getOptionChain(symbol, fromDateInput.value, toDateInput.value, strikeCountSelect.value);
      });
    }
  }

  function loadSymbol(symbol) {
    const listRowDiv = document.createElement("div");
    listRowDiv.id = "listRow-" + symbol + "-Div";
    listRowDiv.className = "listRow";

    const underlyingDiv = document.createElement("div");
    underlyingDiv.id = "underlying-" + symbol + "-Div";
    underlyingDiv.className = "subPanel underlying";
    listRowDiv.appendChild(underlyingDiv);

    let elt = document.createElement("button");
    elt.id = "delete-" + symbol + "-Button";
    elt.className = "icon delete";
    elt.addEventListener("click", processButtonDeleteSymbolClick);
    underlyingDiv.appendChild(elt);

    elt = document.createElement("div");
    elt.id = "symbol-" + symbol + "-Div";
    elt.className = "symbolValue";
    elt.innerHTML = symbol;
    underlyingDiv.appendChild(elt);

    elt = document.createElement("label");
    elt.id = "last-" + symbol + "-Label";
    elt.className = "last";
    elt.innerHTML = "Last";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("div");
    elt.id = "lastValue-" + symbol + "-Div";
    elt.className = "lastValue";
    elt.innerHTML = "NULL";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("label");
    elt.id = "target-" + symbol + "-Label";
    elt.className = "target";
    elt.innerHTML = "Target";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("input");
    elt.id = "targetValue-" + symbol + "-Input";
    elt.className = "targetValue";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("label");
    elt.id = "volm-" + symbol + "-Label";
    elt.className = "volm";
    elt.innerHTML = "Volume";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("div");
    elt.id = "volmValue-" + symbol + "-Div";
    elt.className = "volmValue";
    elt.innerHTML = "NULL";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("label");
    elt.id = "exp-" + symbol + "-Label";
    elt.className = "exp";
    elt.innerHTML = "Expiration";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("div");
    elt.id = "expValue-" + symbol + "-Div";
    elt.className = "expValue";
    elt.innerHTML = "NULL";
    underlyingDiv.appendChild(elt);

    listSection.appendChild(listRowDiv);
    log.print("loadSymbol: " + symbol + " loaded");
  }

  function getOptionChain(symbol, fromDate, toDate, strikeCount) {
    const uri = "https://api.tdameritrade.com/v1/marketdata/chains?" +
      "symbol=" + symbol +
      "&includeQuotes=TRUE" +
      "&strikeCount=" + strikeCount +
      "&fromDate=" + fromDate +
      "&toDate=" + toDate;
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      processGetOptionChainResponse(xhr, symbol, fromDate, toDate, strikeCount);
    };
    xhr.open("GET", uri);
    xhr.setRequestHeader("Authorization", "Bearer " + localStorage.accessToken);
    xhr.send();
    log.print("getOptionChain: " + uri);
  }

  function processGetOptionChainResponse(xhr, symbol, fromDate, toDate, strikeCount) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      const json = JSON.parse(xhr.responseText);
      dbgJson = json;

      if (json.status == "SUCCESS") {
        const underlying = json.underlying;
        const last = underlying !== null && underlying.last !== null ?
          underlying.last.toFixed(2).toLocaleString() : "N/A";
        const volm = underlying.totalVolume !== null ?
          underlying.totalVolume.toLocaleString() : "N/A";
        const expKey = Object.keys(json.callExpDateMap)[0];
        const callChain = json.callExpDateMap[expKey];
        const putChain = json.putExpDateMap[expKey];
        const keyParts = expKey.split(":");
        const dtExp = new Date(keyParts[0] + " 00:00:00");
        const dte = keyParts[1];
        const exp = dtExp.toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric" });

        document.getElementById("lastValue-" + symbol + "-Div").innerHTML = last;
        document.getElementById("volmValue-" + symbol + "-Div").innerHTML = volm;
        document.getElementById("expValue-" + symbol + "-Div").innerHTML = exp + " (" + dte + ")";

        const listRowDiv = document.getElementById("listRow-" + symbol + "-Div");
        const chainDivId = "chain-" + symbol + "-Div";

        let chainDiv = document.getElementById(chainDivId);

        if (chainDiv === null) {
          chainDiv = document.createElement("div");
          chainDiv.id = chainDivId;
          chainDiv.className = "chain";
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

        log.print("ATM Strike: " + atmStrike);

        strikes.forEach((shortStrike, index) => {
          const fShortStrike = parseFloat(shortStrike);
          const shortOption = putChain[shortStrike][0];
          const optionDivId = "option-" + symbol + "-" + shortStrike + "-Div";
          const appendElts = [];
          
          let optionDiv = document.getElementById(optionDivId);

          if (optionDiv === null) {
            const ioatm = fShortStrike > fAtmStrike
              ? "itm" : fShortStrike < fAtmStrike ? "otm" : "atm";
            const oddEven = index % 2 ? "odd" : "even";
            
            optionDiv = document.createElement("div");
            optionDiv.id = optionDivId;
            optionDiv.className = "subPanel option " + ioatm + " " + oddEven;
            chainDiv.appendChild(optionDiv);
          }

          let eltId = "stratValue-" + symbol + "-" + shortStrike + "-Div";
          let elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            elt.className = "stratValue";
            appendElts.push(elt);
          }

          elt.innerHTML = "Naked or Covered Put";

          eltId = "strikeValue-" + symbol + "-" + shortStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            elt.className = "strikeValue text";
            appendElts.push(elt);
          }

          elt.innerHTML = fShortStrike;

          eltId = "deltaValue-" + symbol + "-" + shortStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt == null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            elt.className = "deltaValue numeric";
            appendElts.push(elt);
          }

          elt.innerHTML = shortOption.delta.toFixed(3);

          eltId = "gammaValue-" + symbol + "-" + shortStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            elt.className = "gammaValue numeric";
            appendElts.push(elt);
          }

          elt.innerHTML = shortOption.gamma.toFixed(3);

          eltId = "thetaValue-" + symbol + "-" + shortStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            elt.className = "thetaValue numeric";
            appendElts.push(elt);
          }

          elt.innerHTML = shortOption.theta.toFixed(3);

          eltId = "vegaValue-" + symbol + "-" + shortStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            elt.className = "vegaValue numeric";
            appendElts.push(elt);
          }

          elt.innerHTML = shortOption.vega.toFixed(3);

          eltId = "markValue-" + symbol + "-" + shortStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            elt.className = "markValue numeric";
            appendElts.push(elt);
          }

          elt.innerHTML = shortOption.mark.toFixed(2);

          eltId = "targetValue-" + symbol + "-" + shortStrike + "-Input";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Input");
            elt.id = eltId;
            elt.className = "targetValue numeric";
            appendElts.push(elt);
          }

          appendElts.forEach((elt) => {
            optionDiv.appendChild(elt);
          })
        });
        log.print("processGetOptionChainResponse: json.status=" + json.status);
      } else {
        log.print("processGetOptionChainResponse: json.status=" + json.status, log.ERROR);
      }
    } else if (xhr.readyState == 4 && xhr.status == 401) {
      log.print(
        "processGetOptionChainResponse: xhr.readyState=" +
        xhr.readyState + " xhr.status=" + xhr.status);
      log.print("processGetOptionChainResponse: auth.refreshToken()", log.WARNING);
      auth.refreshToken();
      log.print("processGetOptionChainResponse: getOptionChain()", log.WARNING);
      getOptionChain(symbol, fromDate, toDate, strikeCount);
    } else {
      log.print(
        "processGetOptionChainResponse: xhr.readyState=" +
        xhr.readyState + " xhr.status=" + xhr.status,
        log.ERROR);
    }
  }

  window.addEventListener("load", initCalc);
})();