"use strict";

let auth = (function () {
  let clientID = "NASAPP@AMER.OAUTHAP";
  let redirectURI = "http://localhost";
  let authCode = "";
  let isRefreshed = false;

  function initAuth() {
    let inputClientID;
    let inputRedirectURI;
    let inputAuthCode;

    inputClientID = document.getElementById("clientIDInput");
    inputClientID.value = clientID;
    inputClientID.addEventListener("input", processInputClientIDInput);
    inputRedirectURI = document.getElementById("redirectURIInput");
    inputRedirectURI.value = redirectURI;
    inputRedirectURI.addEventListener("input", processInputRedirectURIInput);
    inputAuthCode = document.getElementById("authCodeInput");
    inputAuthCode.value = authCode;
    inputAuthCode.addEventListener("input", processInputAuthCodeInput);
    document.getElementById("getAuthCodeButton").addEventListener(
      "click", processButtonGetAuthCodeClick);
    document.getElementById("getTokenButton").addEventListener("click", processButtonGetTokenClick);
    document.getElementById("refreshTokenButton").addEventListener(
      "click", processButtonRefreshTokenClick);
  }

  function getAuthCodeURI() {
    return "https://auth.tdameritrade.com/auth?" +
      "response_type=code" +
      "&redirect_uri=" + encodeURIComponent(redirectURI) +
      "&client_id=" + encodeURIComponent(clientID);
  }

  function getToken() {
    let uri = "https://api.tdameritrade.com/v1/oauth2/token";
    let body = "grant_type=authorization_code" +
      "&access_type=offline" +
      "&code=" + encodeURIComponent(authCode) +
      "&client_id=" + encodeURIComponent(clientID) +
      "&redirect_uri=" + encodeURIComponent(redirectURI);
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = processGetTokenResponse;
    xhr.open("POST", uri);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(body);
    log.print("getToken body: " + body);
  }

  function forceRefreshToken() {
    isRefreshed = false;
    refreshToken();
  }

  function processInputClientIDInput() {
    clientID = decodeURIComponent(this.value);
  }

  function processInputRedirectURIInput() {
    redirectURI = decodeURIComponent(this.value);
  }

  function processInputAuthCodeInput() {
    authCode = decodeURIComponent(this.value);
  }

  function processButtonGetAuthCodeClick() {
    window.open(getAuthCodeURI());
  }

  function processButtonGetTokenClick() {
    getToken();
  }

  function processButtonRefreshTokenClick() {
    forceRefreshToken();
  }

  function processGetTokenResponse() {
    if (this.readyState == 4 && this.status == 200) {
      let json = JSON.parse(this.responseText);
      localStorage.accessToken = json.access_token;
      localStorage.refreshToken = json.refresh_token;
      log.print("processGetTokenResponse: " + this.responseText);
    } else {
      log.print("processGetTokenResponse: readyState="
        + this.readyState + " status=" + this.status, log.WARNING);
    }
  }

  function processRefreshTokenResponse() {
    if (this.readyState == 4 && this.status == 200) {
      let json = JSON.parse(this.responseText);
      localStorage.accessToken = json.access_token;
      localStorage.refreshToken = json.refresh_token;
      log.print("processRefreshTokenResponse: " + this.responseText);
    } else {
      log.print("processRefreshTokenResponse: readyState="
        + this.readyState + " status=" + this.status, log.WARNING);
    }
  }

  window.addEventListener("load", initAuth);

  return {
    refreshToken: function() {
      if (isRefreshed) {
        return;
      }

      isRefreshed = true;

      let uri = "https://api.tdameritrade.com/v1/oauth2/token";
      let body = "grant_type=refresh_token" +
        "&refresh_token=" + encodeURIComponent(localStorage.refreshToken) +
        "&access_type=offline" +
        "&client_id=" + encodeURIComponent(clientID);
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = processRefreshTokenResponse;
      xhr.open("POST", uri);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.send(body);
      log.print("refreshToken body: " + body);
    }
  }
})();