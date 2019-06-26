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

var bcrypt = require('bcrypt');
var send2FACode = require('../send2FACode');

module.exports = function(messageObj, session, send, finished) {

  var use2FA = (this.oidc.use2FA !== false);

  if (session.authenticated) {
    return finished({error: 'You are already logged in'});
  }

  var noOfAttempts = session.data.$('loginAttempts').increment();
  if (noOfAttempts > 5) {
    return finished({error: 'Too many attempts to login'});
  }

  var usersDoc = this.db.use(this.oidc.documentName, 'Access');

  if (!usersDoc.exists) {
      // allow login using QEWD Management Password, and then only allow
      // 1 admin user to be created

      // username can be ignored for this scenario

      if (messageObj.params.password === this.userDefined.config.managementPassword) {
        session.data.$('userType').value = 'addAdminUser';
        session.authenticated = true;
        return finished({
          ok: true,
          mode: 'addAdminUser',
        });
      }
      else {
        return finished({error: 'Invalid login attempt'});
      }
  }
  else {
    // check administrator username and password

    var username = messageObj.params.username;
    if (!username || username === '') {
      return finished({error: 'Missing or empty username'});
    }
    var emailIndex = usersDoc.$(['by_email', username]);
    if (!emailIndex.exists) {
      return finished({error: 'Invalid login attempt (1)'});
    }
    var id = emailIndex.value;
    
    var password = messageObj.params.password;
    if (!password || password === '') {
      return finished({error: 'Missing or empty password'});
    }

    var userDoc = usersDoc.$(['by_id', id]);

    var user = userDoc.getDocument(true);

    if (use2FA && user.verified === false) {
      return finished({error: 'Awaiting verification'});
    }

    var hashedPassword = user.password;

    var match = bcrypt.compareSync(password, hashedPassword);
    if (!match) {
      return finished({error: 'Invalid login attempt'});
    }

    if (!use2FA) {
      var mode = user.userType;
      session.data.$('userType').value = mode;
      session.data.$('userId').value = id;
      session.authenticated = true;
      session.timeout = 1200;
      return finished({
        ok: true,
        mode: mode
      });
    }


    // 2FA enabled

    // credentials seem OK

    // Now create code and send to user's mobile to confirm
    // Tell UI that login was OK and it now needs to put up form for 2FA code confirmation

    send2FACode.call(this, id, session, function(response) {
      console.log('Twilio response: ' + JSON.stringify(response, null, 2));
      finished({
        ok: true,
        mode: 'confirmMobileCode'
      });
    });
  }
};
