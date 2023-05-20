module.exports = {
  getSessionToken(req) {
 //   console.log(req.headers.cookie)
    if (!req.headers.cookie) {
      return null;
    }
    const cookies = req.headers.cookie.split(';')
      .map(function (cookie) { return cookie.trim() })
      .filter(function (cookie) { return cookie.includes('session_token') })
      .join('');

    const sessionToken = cookies.slice('session_token='.length);
    if (!sessionToken) {
      return null;
    }
    // console.log(req.headers.cookie)

    return sessionToken;
  }
}