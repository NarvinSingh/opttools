'use strict';

const auth = (function () {
  const defaultClientID = 'NASAPP@AMER.OAUTHAP';
  const defaultRedirectURI = 'http://localhost';
  const authCallbacks = [];
  
  let clientID;
  let redirectURI;
  let authCode = '';
  let isUnauthorized = true;

  function initAuth() {
    setClientID(localStorage.getItem('auth-clientID') || defaultClientID);
    setRedirectURI(localStorage.getItem('auth-redirectURI') || defaultRedirectURI);
  }

  function getClientID() {
    return clientID;
  }

  function setClientID(value) {
    localStorage.setItem('auth-clientID', value);
    clientID = value;
  }

  function getRedirectURI() {
    return redirectURI;
  }

  function setRedirectURI(value) {
    localStorage.setItem('auth-redirectURI', value);
    redirectURI = value;
  }

  function getAuthCodeURI() {
    return `https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=${encodeURIComponent(redirectURI)}&client_id=${encodeURIComponent(clientID)}`;
  }

  function setAuthCode(value) {
    authCode = value;
  }

  function getToken() {
    return localStorage.getItem('auth-accessToken');
  }

  function getIsUnauthorized() {
    return isUnauthorized;
  }

  function setIsUnauthorized(value) {
    isUnauthorized = !!(value === 'false' ? false : value);
    authCallbacks.forEach((callback) => callback.call(this, !isUnauthorized));
  }

  function requestToken() {
    let uri = 'https://api.tdameritrade.com/v1/oauth2/token';
    let body = `grant_type=authorization_code&access_type=offline&code=${encodeURIComponent(authCode)}&client_id=${encodeURIComponent(clientID)}&redirect_uri=${encodeURIComponent(redirectURI)}`;
    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = processTokenResponse;
    xhr.open('POST', uri);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(body);
  }

  function refreshToken() {
    let uri = 'https://api.tdameritrade.com/v1/oauth2/token';
    let body = `grant_type=refresh_token&refresh_token=${encodeURIComponent(localStorage.refreshToken)}&access_type=offline&client_id=${encodeURIComponent(clientID)}`;
    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = processTokenResponse;
    xhr.open('POST', uri);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(body);
  }

  function addAuthCallback(callback) {
    if (!authCallbacks.includes(callback)) {
      authCallbacks.push(callback);
    }
  }

  function removeAuthCallback(callback) {
    const index = authCallbacks.indexOf(callback);

    if (index !== -1) {
      authCallbacks.splice(index, 1);
    }
  }

  function processTokenResponse() {
    if (this.readyState == 4 && this.status == 200) {
      log.print(`processTokenResponse: readyState=${this.readyState} status=${this.status}`);

      let json = JSON.parse(this.responseText);

      localStorage.setItem('auth-accessToken', json.access_token);
      localStorage.setItem('auth-refreshToken', json.refresh_token);
      isUnauthorized = false;
      authCallbacks.forEach((callback) => callback.call(this, true));
    } else if (this.readyState == 4) {
      log.print(
        `processTokenResponse: readyState=${this.readyState} status=${this.status}`,
        log.WARNING
      );
      isUnauthorized = true;
      authCallbacks.forEach((callback) => callback.call(this, false));
    }
  }

  window.addEventListener('load', initAuth);

  return {
    getClientID: getClientID,
    setClientID: setClientID,
    getRedirectURI: getRedirectURI,
    setRedirectURI: setRedirectURI,
    getAuthCodeURI: getAuthCodeURI,
    setAuthCode: setAuthCode,
    getToken: getToken,
    getIsUnauthorized: getIsUnauthorized,
    setIsUnauthorized: setIsUnauthorized,
    requestToken: requestToken,
    refreshToken: refreshToken,
    addAuthCallback: addAuthCallback,
    removeAuthCallback: removeAuthCallback
  }
}());