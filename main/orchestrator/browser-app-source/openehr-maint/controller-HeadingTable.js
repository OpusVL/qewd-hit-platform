/*

 ----------------------------------------------------------------------------
 | ripple-admin: Ripple User Administration MicroService                    |
 |                                                                          |
 | Copyright (c) 2018 Ripple Foundation Community Interest Company          |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://rippleosi.org                                                     |
 | Email: code.custodian@rippleosi.org                                      |
 |                                                                          |
 | Author: Rob Tweed, M/Gateway Developments Ltd                            |
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

  13 June 2018

*/


function deleteCompositionRestRequest(uid, controller, callback) {
  $.ajax({
    url: '/openehr/composition/' + uid,
    method: 'DELETE',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + controller.getJWT()
    },
    dataType: 'json',
    timeout: 20000
  })
  .done(function(data) {
    console.log('*** received response: ' + JSON.stringify(data));
    if (data.token) {
      controller.token = data.token;
      console.log('JWT updated');
    }
    callback(data);
  })
  .fail(function(err, textStatus, errorThrown) {
    console.log('*** Delete Composition error: ' + JSON.stringify(err));
    if (!err.responseJSON || !err.responseJSON.error) {
      controller.emit('error', {message: {error: 'Your request timed out'}});
    }
    else {
      controller.emit('error', {message: {error: err.responseJSON.error}});
    }
  });
}

function deleteHeadingRecord(uid, controller, callback) {
  var index = this.headingArrayIndex[uid];
  var headingRecord = this.headingArray[index];
  if (headingRecord.isLocked) {
    controller.toastr('success', uid + ' left alone');
    callback(uid);
  }
  else {
   setTimeout(function() {
    deleteCompositionRestRequest(uid, controller, function(data) {
      controller.toastr('info', uid + ' deleted');
      callback(uid);
    });
   }, 1000);
  }
}

module.exports = function (controller, component) {

  console.log('HeadingTable props: ' + JSON.stringify(component.props));

  component.headingArray = component.props.data;
  component.headingFields = component.props.headingFields;
  
  component.showConfirm = false;
  component.showConfirmCleardown = false;
  component.showDeletion = false;
  component.showHeadingDeleted = false;
  component.sourceIdToDelete = false;
  component.sourceIdToDisplay = false;
  component.sourceToDisplay = false;
  component.warningMessage = '';

  //component.isLocked = {};

  component.cancelDelete = function() {
    component.showConfirm = false;
    component.sourceIdToDelete = false;
    component.sourceIdToDisplay = false;
    component.sourceToDisplay = false;
    component.setState({
      status: 'cancelDelete'
    });
  }

  component.confirmDelete = function() {

    // Modal confirmation of delete has been confirmed

    console.log('delete requested for patientId: ' + component.props.patientId);
    console.log('heading: ' + component.props.heading);
    console.log('uid: ' + component.sourceIdToDelete);

    deleteCompositionRestRequest(component.sourceIdToDelete, controller, function(data) {
      var index = component.headingArrayIndex[component.sourceIdToDelete];
      // remove the record from the Heading Array, and therefore from the table on display
      component.headingArray.splice(index, 1);

      // pass up to getHeadingSummary
      controller.emit('headingListReceived', {
        data: component.headingArray,
        heading: component.props.heading,
        warning: component.sourceIdToDelete + ' deleted from OpenEHR'
      });
    });
  }

  component.clearDownHeading = function() {
    component.showConfirmCleardown = true;
    component.setState({
      status: 'showConfirmCleardownDialog'
    });
  }

  component.cancelCleardown = function() {
    component.showConfirmCleardown = false;
    component.setState({
      status: 'cancelCleardown'
    });
  }

  // ? I think this is now redundant
  controller.on('deleteHeading', function(responseObj) {
    console.log('*** deleteHeading event: ' + JSON.stringify(responseObj));
    if (!responseObj.finished) {
      component.showDeletion = true;
      var id = responseObj.message.deleted;
      var source = id.split('-')[0];
      component.openEHRSource = source;
      component.compositionId = id.split(source + '-')[1];
      component.setState({
        status: 'confirmDeletion'
      });
    }
    else {
      component.showDeletion = false;
      component.showHeadingDeleted = true;
      component.setState({
        status: 'deletionCompleted'
      });
      //controller.emit('HeadingDeleted');
    }
  });

  component.confirmCleardown = function() {

    component.showConfirmCleardown = false;
    component.setState({
      status: 'beginCleardown'
    });

    // commence iterating through heading array, sending a delete request for each one in turn
    // after awaiting the response

    var max = component.headingArray.length;

    component.remainingData = [];

    function deleteARecord(no) {
      var headingRecord = component.headingArray[no];
      var uid = headingRecord.uid;
      console.log('record ' + no + ': uid = ' + uid);
      deleteHeadingRecord.call(component, uid, controller, function(sourceId) {
        if (headingRecord.isLocked) {
          component.remainingData.push(headingRecord);
        }
        no++;
        if (no === max) {
          controller.emit('headingListReceived', {
            data: component.remainingData,
            heading: component.props.heading,
            warning: 'Deletion completed: ' + max + ' records processed'
          });
        }
        else {
          deleteARecord(no);
        }
      });
    }

    deleteARecord(0);
  }

  controller.on('DeleteHeading', function(messageObj) {
    console.log('DeleteHeading event triggered from HeadingTableRow...');
    console.log('messageObj: ' + JSON.stringify(messageObj, null, 2));
    component.showConfirm = true;
    component.sourceIdToDelete = messageObj.id;
    //var pieces = messageObj.id.split('-');
    //var source = pieces[0];
    component.sourceToDisplay = '';
    //source = source + '-';
    component.sourceIdToDisplay = messageObj.id;

    // reload HeadingTable with modal confirm panel on
    component.setState({
      status: 'showConfirmDialog'
    });
  });

  controller.on('lockRecord', function(responseObj) {
    var index = component.headingArrayIndex[responseObj.id];
    var headingRecord = component.headingArray[index];
    headingRecord.isLocked = true;
    //component.isLocked[responseObj.id] = true;
    console.log('isLocked: ' + JSON.stringify(headingRecord.isLocked));
    component.setState({
      status: 'recordLocked'
    });
  });

  controller.on('unlockRecord', function(responseObj) {
    var index = component.headingArrayIndex[responseObj.id];
    var headingRecord = component.headingArray[index];
    headingRecord.isLocked = false;
    //component.isLocked[responseObj.id] = false;
    console.log('isLocked: ' + JSON.stringify(headingRecord.isLocked));
    component.setState({
      status: 'recordUnlocked'
    });
  });

  return controller;

};
