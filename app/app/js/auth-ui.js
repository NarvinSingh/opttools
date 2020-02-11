'use strict';

(function () {
  function initAuthUI() {
    let inputClientID = document.getElementById('clientIDInput');
    let inputRedirectURI = document.getElementById('redirectURIInput');

    inputClientID.value = auth.getClientID();
    inputClientID.addEventListener('input', handleInputClientIDInput);
    inputRedirectURI.value = auth.getRedirectURI();
    inputRedirectURI.addEventListener('input', handleInputRedirectURIInput);
    document.getElementById('authCodeInput').addEventListener('input', handleInputAuthCodeInput);
    document.getElementById('getAuthCodeButton')
      .addEventListener('click', handleButtonGetAuthCodeClick);
    document.getElementById('requestTokenButton')
      .addEventListener('click', handleButtonRequestTokenClick);
    document.getElementById('refreshTokenButton')
      .addEventListener('click', handleButtonRefreshTokenClick);
  }

  function handleInputClientIDInput() {
    auth.setClientID(decodeURIComponent(this.value));
  }

  function handleInputRedirectURIInput() {
    auth.setRedirectURI(decodeURIComponent(this.value));
  }

  function handleInputAuthCodeInput() {
    auth.setAuthCode(decodeURIComponent(this.value));
  }

  function handleButtonGetAuthCodeClick() {
    window.open(auth.getAuthCodeURI());
  }

  function handleButtonRequestTokenClick() {
    auth.requestToken();
  }

  function handleButtonRefreshTokenClick() {
    auth.refreshToken();
  }

  window.addEventListener('load', initAuthUI);
}());