/*

 ----------------------------------------------------------------------------
 | oidc-provider: OIDC Provider QEWD-Up MicroService                        |
 |                                                                          |
 | Copyright (c) 2019 M/Gateway Developments Ltd,                           |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  13 March 2019

*/

var send2FACode = require('../send2FACode');

module.exports = function(messageObj, session, send, finished) {

  if (session.authenticated) {
    return finished({error: 'You are already logged in'});
  }

  var twoFa = session.data.$('2fa');
  if (!twoFa.exists) {
    return finished({error: 'Invalid request'});
  }

  var id = twoFa.$('id').value;

  // Create code and send to user's mobile to confirm

  send2FACode.call(this, id, session, function(response) {
    console.log('Twilio response: ' + JSON.stringify(response, null, 2));
    finished({ok: true});
  });

};
