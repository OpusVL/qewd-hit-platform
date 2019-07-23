/*

 ----------------------------------------------------------------------------
 | openehr-maint: OpenEHR Maintenance Interface                             |
 |                                                                          |
 | Copyright (c) 2018-19 M/Gateway Developments Ltd,                        |
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

 19 June 2019

*/

"use strict"

var React = require('react');
var createReactClass = require('create-react-class');
var jQuery = require('jquery');
window.$ = window.jQuery = jQuery;
var ReactBootstrap = require('react-bootstrap');

import { ToastContainer } from "react-toastr"

var {
  Alert,
  Button
} = ReactBootstrap;

var Banner = require('./Banner');
var Content = require('./Content');
var Shutdown = require('./Shutdown');
var NotLoggedIn = require('./NotLoggedIn');
var LoginModal = require('./LoginModal');

var MainPage = createReactClass({

  getInitialState: function() {
    return {
      status: 'initial'
    }
  },

  componentWillMount: function() {
    this.controller = require('./controller-MainPage').call(this, this.props.controller);
  },

  componentDidMount: function() {
    window.addEventListener('message', this.handleIframeMsg);
  },

  componentDidUpdate: function() {
    if (this.error && this.error !== '') {
      this.controller.displayError(this.error);
    }
  },

  render: function() {
    console.log('rendering MainPage');

    console.log('status = ' + this.state.status);

    if (this.state.status === 'initial') {
      return (
        <div>Please wait...</div>
      );
    }

    if (this.state.status === 'shutdown') {
      return (
        <Shutdown
         controller = {this.controller}
        />
      );
    }

    if (this.props.status === 'disconnected') {
      console.log('** disconnected!');
      this.controller.displayError('Your Session has expired');
      return (
        <NotLoggedIn
          title = {this.title} 
        />
      );
    }

    if (this.state.status === 'redirectError') {
      return (
        <div>
          <Banner
            controller = {this.controller}
          />

          <ToastContainer 
            ref={ref => this.toastContainer = ref}
            className="toast-top-right"
            newestOnTop={true}
            target="body"
          />
        </div>
      );
    }

    if (this.state.status === 'loggedIn') {
      return (
        <div>
          <Banner
            controller = {this.controller}
          />

          <ToastContainer 
            ref={ref => this.toastContainer = ref}
            className="toast-top-right"
            newestOnTop={true}
            target="body"
          />

          <Content
            controller = {this.controller}
            status = {this.state.status}
          />
        </div>
      );
    }

    return (
      <div>
        <Banner
          controller = {this.controller}
        />

        <ToastContainer 
          ref={ref => this.toastContainer = ref}
          className="toast-top-right"
          newestOnTop={true}
          target="body"
        />

        <LoginModal
          controller = {this.controller}
          show = {this.showLoginModal}
          redirectUrl = {this.redirectUrl}
        />

      </div>
    );
  }
});

module.exports = MainPage;
