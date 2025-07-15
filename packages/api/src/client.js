"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.createCaller = exports.createQueryClient = exports.api = void 0;
var react_1 = require("./client/react");
__createBinding(exports, react_1, "api");
var query_client_1 = require("./client/query-client");
__createBinding(exports, query_client_1, "createQueryClient");
var server_1 = require("./client/server");
__createBinding(exports, server_1, "createCaller");
