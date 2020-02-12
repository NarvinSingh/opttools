'use strict';

(function () {
  function initAuthUI() {
    let inputClientID = document.getElementById('clientIDInput');
    let inputRedirectURI = document.getElementById('redirectURIInput');

    inputClientID.value = auth.getClientID();
    inputClientID.addEventListener('input', handleClientIDInputEvent);
    inputRedirectURI.value = auth.getRedirectURI();
    inputRedirectURI.addEventListener('input', handleRedirectURIInputEvent);
    document.getElementById('authCodeInput').addEventListener('input', handleAuthCodeInputEvent);
    document.getElementById('getAuthCodeButton')
      .addEventListener('click', handleGetAuthCodeButtonEvent);
    document.getElementById('requestTokenButton')
      .addEventListener('click', handleRequestTokenButtonEvent);
    document.getElementById('refreshTokenButton')
      .addEventListener('click', handleRefreshTokenButtonEvent);
  }

  function handleClientIDInputEvent() {
    auth.setClientID(decodeURIComponent(this.value));
  }

  function handleRedirectURIInputEvent() {
    auth.setRedirectURI(decodeURIComponent(this.value));
  }

  function handleAuthCodeInputEvent() {
    auth.setAuthCode(decodeURIComponent(this.value));
  }

  function handleGetAuthCodeButtonEvent() {
    window.open(auth.getAuthCodeURI());
  }

  function handleRequestTokenButtonEvent() {
    auth.requestToken();
  }

  function handleRefreshTokenButtonEvent() {
    auth.refreshToken();
  }

  window.addEventListener('load', initAuthUI);
}());