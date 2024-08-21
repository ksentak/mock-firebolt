/*
* Copyright 2021 Comcast Cable Communications Management, LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* SPDX-License-Identifier: Apache-2.0
*/

// HTTP-based API routes: User-Related

'use strict';

import { v4 as uuidv4 } from 'uuid';
import * as userManagement from '../../userManagement.mjs';
import * as stateManagement from '../../stateManagement.mjs';
import { config } from '../../config.mjs';
import { logger } from '../../logger.mjs';



// --- Route Handlers ---

// PUT /api/v1/user/:userId?
// POST /api/v1/user/:userId?
// Expected body: N/A
// URL Param "userId" - Optional
function addUser(req, res) {
  let userId;
  if (req.params.userId){
    userId = req.params.userId;
  }
  if (userId){
    // Make sure we have starter (empty) state for this user
    let response = stateManagement.addUser(userId);
    // Make sure we have a web socket server for this user
    userManagement.addUser(userId);

    if (response.isSuccess){
      res.status(200).send({
        status: 'SUCCESS',
        userId: userId
      });
      logger.info(`Added user ${userId}`);
    }
    else{
      res.status(400).send({
        status: 'ERROR',
        errorCode: 'Cannot add user',
        message: response.msg
      });
    }
  }
  else {
    // Generate a unique userId for this user (no vanity userIds, at least for now)
    userId = uuidv4();

    // Make sure we have starter (empty) state for this user
    stateManagement.addUser(userId);
    // Make sure we have a web socket server for this user
    userManagement.addUser(userId);

    res.status(200).send({
      status: 'SUCCESS',
      userId: userId
      });
  }
}

//GET /api/v1/user
function getUsers(req, res) {
  const users = userManagement.getUsers();
  res.status(200).send({
    status: 'SUCCESS',
    users: users
  });
}

// POST /api/v1/state/enableInteractionLogs
// Expected body: { enabled: true }
// Expected headers: x-mockfirebolt-userid - The user id of the user making the request
//  E.g., { enabled: true }
function enableInteractionLogs(req, res) {
  if (req.body.hasOwnProperty("enabled")) {
    if (req.body.enabled !== true) {
      return res.status(400).send({
        status: "ERROR",
        errorCode: "INVALID-ENABLED-VALUE",
        message: "Enabled value must be true",
      });
    }
    const user = req.get("x-mockfirebolt-userid");
    config.interactionService == undefined && (config.interactionService = new Map());
    config.interactionService.set(user, req.body);
    return res.status(200).send({
      status: "SUCCESS",
      message: "Successfully started interactionService",
    });
  } else {
    return res.status(400).send({
      status: "ERROR",
      errorCode: "MISSING-STATE",
      message: "Did not find expected 'enabled' key within post body",
    });
  }
}

// POST /api/v1/state/disableInteractionLogs
// Expected body: { enabled: false }
// Expected headers: x-mockfirebolt-userid - The user id of the user making the request
//  E.g., { enabled: false }
function disableInteractionLogs(req, res) {
  if (req.body.hasOwnProperty("enabled")) {
    if (req.body.enabled !== false) {
      // If the incoming request enabled value is not `false`, return an error
      return res.status(400).send({
        status: "ERROR",
        errorCode: "INVALID-ENABLED-VALUE",
        message: "Enabled value must be false",
      });
    }
    const user = req.get("x-mockfirebolt-userid");
    // If the user is not found in the interactionService, return an error
    if (!config.interactionService.has(user)) {
      return res.status(400).send({
        status: "ERROR",
        errorCode: "USER-NOT-FOUND",
        message: "User not found in interactionService",
      });
    }
    config.interactionService.delete(user);
    return res.status(200).send({
      status: "SUCCESS",
      message: "Successfully stopped interactionService",
    });
  } else {
    // If the incoming request does not have an enabled key, return an error
    return res.status(400).send({
      status: "ERROR",
      errorCode: "MISSING-STATE",
      message: "Did not find expected 'enabled' key within post body",
    });
  }
}


// --- Exports ---

export {
  addUser,getUsers,enableInteractionLogs,disableInteractionLogs
};
