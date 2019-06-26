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

  14 March 2019

*/

module.exports = function(messageObj, session, send, finished) {

  var name = messageObj.params.name;
  if (!name || name === '') {
    return finished({error: 'Missing or empty Claim Id/Name'});
  }

  var fields = messageObj.params.fields;
  if (!fields || fields === '') {
    return finished({error: 'Missing or empty Field List'});
  }

  var fieldArr = fields.split('\n');
  // remove any blank fields, particularly at the end of the textarea content
  var fieldArray = [];
  fieldArr.forEach(function(field) {
    if (field !== '') fieldArray.push(field);
  });

  var id = messageObj.params.id;
  if (typeof id === 'undefined') {
    return finished({error: 'Invalid request 2'});
  }

  var claimsDoc = this.db.use(this.oidc.documentName, 'Claims');

  if (id === '') {
    // saving a new record

    if (claimsDoc.$(['by_name', name]).exists) {
      return finished({error: 'A Claim with id/name ' + name + ' already exists'});
    }

    id = claimsDoc.$('next_id').increment();
    claimsDoc.$(['by_id', id]).setDocument({
      name: name,
      fields: fieldArray
    });
    //claimsDoc.$(['by_name', name]).value = id;
  }
  else {
    // updating existing record
    var claimDoc = claimsDoc.$(['by_id', id]);
    if (!claimDoc) {
      return finished({error: 'No such Claim Record Id'});
    }
    var old_name = claimDoc.$('name').value;

    if (name !== old_name) {
      if (claimsDoc.$(['by_name', name]).exists) {
        return finished({error: 'Claim name ' + name + ' already exists'});
      }
      //claimsDoc.$(['by_name', name]).value = id;
      //claimsDoc.$(['by_name', old_name]).delete();
    }

    claimDoc.delete(); // ensures field array is cleared down first
    claimDoc. setDocument({
      name: name,
      fields: fieldArray
    });
  }

  return finished({
    ok: true
  });

};
