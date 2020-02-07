var dbgJson;

(function () {
  var sectionList;
  var fromDateInput;
  var toDateInput;
  var strikeCountSelect;

  function initCalc() {
    var nowDate = (new Date()).toISOString().substr(0, 10);

    sectionList = document.getElementById("listSection");
    fromDateInput = document.getElementById("fromDateInput");
    toDateInput = document.getElementById("toDateInput");
    strikeCountSelect = document.getElementById("strikeCountSelect");
    fromDateInput.value = nowDate;
    toDateInput.value = nowDate;
    strikeCountSelect.value = 13;
    document.getElementById("calcButton").addEventListener("click", processButtonCalcClick);

    if(localStorage.watchlist) {      
      localStorage.watchlist.split(",").forEach(loadSymbol);
    }
  }

  function loadSymbol(symbol, index) {
    var listRowDiv = document.createElement("div");
    listRowDiv.id = "listRow" + index + "Div";
    listRowDiv.className = "listRow";

    var underlyingDiv = document.createElement("div");
    underlyingDiv.id = "underlying" + index + "Div";
    underlyingDiv.className = "panelGrid underlying";
    listRowDiv.appendChild(underlyingDiv);

    var elt = document.createElement("div");
    elt.id = "symbol" + index + "Div";
    elt.className = "redacted3 symbolValue";
    elt.innerHTML = symbol;
    underlyingDiv.appendChild(elt);

    elt = document.createElement("label");
    elt.id = "last" + index + "Label";
    elt.className = "redacted3 last";
    elt.innerHTML = "Last";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("div");
    elt.id = "lastValue" + index + "Div";
    elt.className = "lastValue";
    elt.innerHTML = "NULL";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("label");
    elt.id = "target" + index + "Label";
    elt.className = "redacted3 target";
    elt.innerHTML = "Target";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("input");
    elt.id = "targetValue" + index + "Input";
    elt.className = "targetValue";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("label");
    elt.id = "volm" + index + "Label";
    elt.className = "redacted3 volm";
    elt.innerHTML = "Volume";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("div");
    elt.id = "volmValue" + index + "Div";
    elt.className = "volmValue";
    elt.innerHTML = "NULL";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("label");
    elt.id = "exp" + index + "Label";
    elt.className = "redacted3 exp";
    elt.innerHTML = "Expiration";
    underlyingDiv.appendChild(elt);

    elt = document.createElement("div");
    elt.id = "expValue" + index + "Div";
    elt.className = "expValue";
    elt.innerHTML = "NULL";
    underlyingDiv.appendChild(elt);

    sectionList.appendChild(listRowDiv);
  }

  function processButtonCalcClick() {
    if(localStorage.watchlist) {      
      localStorage.watchlist.split(",").forEach(function(symbol, index) {
        getOptionChain(
          symbol,
          fromDateInput.value,
          toDateInput.value,
          strikeCountSelect.value,
          index);
      });
    }
  }

  function getOptionChain(symbol, fromDate, toDate, strikeCount, index) {
    var uri = "https://api.tdameritrade.com/v1/marketdata/chains?" +
      "symbol=" + symbol +
      "&includeQuotes=TRUE" +
      "&strikeCount=" + strikeCount +
      "&fromDate=" + fromDate +
      "&toDate=" + toDate;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      processGetOptionChainResponse(xhr, index);
    };
    xhr.open("GET", uri);
    xhr.setRequestHeader("Authorization", "Bearer " + localStorage.accessToken);
    xhr.send();
  }

  function processGetOptionChainResponse(xhr, index) {
    if(xhr.readyState == 4 && xhr.status == 200) {
      var json = JSON.parse(xhr.responseText);
      dbgJson = json;

      if(json.status == "SUCCESS") {
        var last = (json.underlying.last != null ? json.underlying.last : json.underlyingPrice).toFixed(2).toLocaleString();
        var volm = json.underlying.totalVolume != null ? json.underlying.totalVolume.toLocaleString() : "N/A";
        var expKey = Object.keys(json.callExpDateMap)[0];
        var callChain = json.callExpDateMap[expKey];
        var putChain = json.putExpDateMap[expKey];
        var keyParts = expKey.split(":");
        var dtExp = new Date(keyParts[0] + " 00:00:00");
        var dte = keyParts[1];
        var exp = dtExp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        var strikes = [];
        var shortStrike;
        var atmStrike;
        var fAtmStrike = 0;
        var listRowDiv = document.getElementById("listRow" + index + "Div");
        var optionDivId = "option" + index + "Div";
        var optionDiv;
        var elt;
        var eltId;
        var appendElts = [];
        var ioatm;
        var oddEven;
        var iStrike;

        optionDiv = document.getElementById(optionDivId);

        if (optionDiv === null) {
          optionDiv = document.createElement("div");
          optionDiv.id = optionDivId;
          optionDiv.className = "panelGrid option";
          listRowDiv.appendChild(optionDiv);
        }
        
        document.getElementById("lastValue" + index + "Div").innerHTML = last;
        document.getElementById("volmValue" + index + "Div").innerHTML = volm;
        document.getElementById("expValue" + index + "Div").innerHTML = exp + " (" + dte + ")";

        for(shortStrike in putChain) {
          var fShortStrike = parseFloat(shortStrike);

          while(iStrike < strikes.length && fShortStrike < parseFloat(strikes[iStrike])) {
            iStrike++;
          }

          strikes.splice(iStrike, 0, shortStrike);

          if(Math.abs(fShortStrike - last) < Math.abs(fAtmStrike - last)) {
            fAtmStrike = fShortStrike;
            atmStrike = shortStrike;
          }
        }

        for(iStrike = 0; iStrike < strikes.length; iStrike++) {
          var shortStrike = strikes[iStrike];
          var fShortStrike = parseFloat(shortStrike);
          var shortOption = putChain[shortStrike][0];

          ioatm = fShortStrike > fAtmStrike ? "itm" : fShortStrike < fAtmStrike ? "otm" : "atm";
          oddEven = oddEven === "odd" ? "even" : "odd";

          eltId = "stratValue-" + index + "-" + iStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            appendElts.push(elt);
          }

          elt.className = ioatm + " " + oddEven + " stratValue redacted";
          elt.innerHTML = "Naked or Covered Put";

          eltId = "strikeValue-" + index + "-" + iStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            appendElts.push(elt);
          }

          elt.className = ioatm + " " + oddEven + " text strikeValue";
          elt.innerHTML = fShortStrike;

          eltId = "deltaValue-" + index + "-" + iStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt == null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            appendElts.push(elt);
          }

          elt.className = ioatm + " " + oddEven + " numeric deltaValue";
          elt.innerHTML = shortOption.delta.toFixed(3);

          eltId = "gammaValue-" + index + "-" + iStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            appendElts.push(elt);
          }

          elt.className = ioatm + " " + oddEven + " numeric gammaValue";
          elt.innerHTML = shortOption.gamma.toFixed(3);

          eltId = "thetaValue-" + index + "-" + iStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            appendElts.push(elt);
          }

          elt.className = ioatm + " " + oddEven + " numeric thetaValue";
          elt.innerHTML = shortOption.theta.toFixed(3);

          eltId = "vegaValue-" + index + "-" + iStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            appendElts.push(elt);
          }

          elt.className = ioatm + " " + oddEven + " numeric vegaValue";
          elt.innerHTML = shortOption.vega.toFixed(3);

          eltId = "markValue-" + index + "-" + iStrike + "-Div";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Div");
            elt.id = eltId;
            appendElts.push(elt);
          }

          elt.className = ioatm + " " + oddEven + " numeric markValue";
          elt.innerHTML = shortOption.mark.toFixed(2);

          eltId = "targetValue-" + index + "-" + iStrike + "-Input";
          elt = document.getElementById(eltId);

          if (elt === null) {
            elt = document.createElement("Input");
            elt.id = eltId;
            appendElts.push(elt);
          }

          elt.className = ioatm + " " + oddEven + " numeric targetValue";

          appendElts.forEach(function(elt) {
            optionDiv.appendChild(elt);
          })
        }
      } else {
        log.print("processGetOptionChainResponse: json.status=" + json.status, log.ERROR);
      }

      log.print("ATM Strike: " + atmStrike);
    } else if(xhr.readyState == 4 && xhr.status == 401) {
      var symbol;
      var fromDate;
      var toDate;
      var strikeCount;

      log.print("processGetOptionChainResponse: xhr.readyState=" + xhr.readyState + " xhr.status=" + xhr.status);
      auth.refreshToken();
  
      symbol = document.getElementById("symbol" + index + "Div").innerHTML;
      fromDate = fromDateInput.value;
      toDate = toDateInput.value;
      strikeCount = strikeCountSelect.value;
      log.print("refresh");
      getOptionChain(symbol, fromDate, toDate, strikeCount, index);
    } else {
      log.print("processGetOptionChainResponse: xhr.readyState=" + xhr.readyState + " xhr.status=" + xhr.status);
    }
  }

  window.addEventListener("load", initCalc);
})();