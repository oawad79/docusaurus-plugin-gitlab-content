"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var fs_1 = require("fs");
//import { join } from "path"
var utils_1 = require("./utils");
var fs_2 = require("fs");
// noinspection JSUnusedGlobalSymbols
function pluginGitLabContent(context, options) {
    return __awaiter(this, void 0, void 0, function () {
        function findRemoteItems() {
            return __awaiter(this, void 0, void 0, function () {
                var a, resolvedLocations, _a, _i, resolvedLocations_1, location_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            a = [];
                            if (!(typeof locations === "function")) return [3 /*break*/, 1];
                            _a = locations();
                            return [3 /*break*/, 3];
                        case 1: return [4 /*yield*/, locations];
                        case 2:
                            _a = (_b.sent());
                            _b.label = 3;
                        case 3:
                            resolvedLocations = _a;
                            for (_i = 0, resolvedLocations_1 = resolvedLocations; _i < resolvedLocations_1.length; _i++) {
                                location_1 = resolvedLocations_1[_i];
                                a.push({ location: location_1 });
                            }
                            return [2 /*return*/, a];
                    }
                });
            });
        }
        // async function getTargetDirectory(): Promise<string> {
        //     const returnValue = join(context.siteDir, outDir)
        //
        //     if (!existsSync(returnValue)) {
        //         mkdirSync(returnValue, { recursive: true })
        //     }
        //
        //     return returnValue
        // }
        function fetchGitLabContent() {
            return __awaiter(this, void 0, void 0, function () {
                var c, promises, _loop_1, _i, c_1, location_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cleanContent();
                            return [4 /*yield*/, findRemoteItems()];
                        case 1:
                            c = _a.sent();
                            promises = [];
                            _loop_1 = function (location_2) {
                                promises.push(axios_1.default.get("https://gitlab.autozone.com/api/v4/search?scope=projects&search=".concat(location_2), requestConfig).then(function (response) {
                                    if (!(0, fs_1.existsSync)(location_2)) {
                                        (0, fs_1.mkdirSync)(location_2, { recursive: true });
                                    }
                                    fetchContent(response.data, location_2);
                                }));
                            };
                            for (_i = 0, c_1 = c; _i < c_1.length; _i++) {
                                location_2 = c_1[_i].location;
                                _loop_1(location_2);
                            }
                            Promise.all(promises);
                            return [2 /*return*/];
                    }
                });
            });
        }
        function fetchContent(projects, location) {
            var _loop_2 = function (project) {
                if (project.path_with_namespace.startsWith(location)) {
                    axios_1.default.get("https://gitlab.autozone.com/api/v4/projects/".concat(project.id, "/repository/files/README.md/raw"), requestConfig).then(function (response) {
                        (0, fs_1.writeFileSync)("/home/oawad/myapps/WebstormProjects/gitlab-test/".concat(location, "/").concat(project.name, "-README.md"), response.data);
                    }).catch(function (reason) {
                        //console.error(`Project ${project.id} with Name: ${project.name} Errored! with -> `, reason);
                    });
                }
            };
            for (var _i = 0, projects_1 = projects; _i < projects_1.length; _i++) {
                var project = projects_1[_i];
                _loop_2(project);
            }
        }
        // async function fetchContent_old(): Promise<void> {
        //     const c = await findRemoteItems()
        //
        //     for (const { id } of c) {
        //         //#region Run modifyContent (and fetch the data)
        //         let content = (
        //             await axios({
        //                 //https://gitlab.autozone.com
        //                 baseURL: sourceBaseUrl + '/api/v4/search?scope=projects&search=supply-chain/services',
        //                 url: id,
        //                 ...requestConfig,
        //             })
        //         ).data
        //         let newIdent = id
        //
        //         const called = modifyContent?.(newIdent, content)
        //
        //         let cont = called?.content
        //         if (cont && typeof cont === "string") {
        //             content = cont
        //         }
        //
        //         let fn
        //         if ((fn = called?.filename) && typeof fn === "string") {
        //             newIdent = fn
        //         }
        //         //#endregion
        //
        //         const checkIdent = newIdent.split("/").filter((seg) => seg !== "")
        //         checkIdent.pop()
        //
        //         // if we are outputting to a subdirectory, make sure it exists
        //         if (checkIdent.length > 0) {
        //             mkdirSync(
        //                 join(await getTargetDirectory(), checkIdent.join("/")),
        //                 { recursive: true }
        //             )
        //         }
        //
        //         writeFileSync(join(await getTargetDirectory(), newIdent), content)
        //     }
        // }
        // async function cleanContent_old(): Promise<void> {
        //     const c = await findRemoteItems()
        //
        //     for (const { location } of c) {
        //         delFile(join(await getTargetDirectory(), id))
        //     }
        // }
        function cleanContent() {
            return __awaiter(this, void 0, void 0, function () {
                var c, _i, c_2, location_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, findRemoteItems()];
                        case 1:
                            c = _a.sent();
                            for (_i = 0, c_2 = c; _i < c_2.length; _i++) {
                                location_3 = c_2[_i].location;
                                //delFile(join(await getTargetDirectory(), id))
                                fs_2.default.rmSync("/home/oawad/myapps/WebstormProjects/gitlab-test/".concat(location_3), { recursive: true, force: true });
                            }
                            return [2 /*return*/];
                    }
                });
            });
        }
        var name, sourceBaseUrl, outDir, locations, _a, noRuntimeDownloads, _b, performCleanup, _c, requestConfig, _d, modifyContent;
        return __generator(this, function (_e) {
            name = options.name, sourceBaseUrl = options.sourceBaseUrl, outDir = options.outDir, locations = options.locations, _a = options.noRuntimeDownloads, noRuntimeDownloads = _a === void 0 ? false : _a, _b = options.performCleanup, performCleanup = _b === void 0 ? true : _b, _c = options.requestConfig, requestConfig = _c === void 0 ? {} : _c, _d = options.modifyContent, modifyContent = _d === void 0 ? function () { return undefined; } : _d;
            console.log("Site Directory : ", context.siteDir);
            if (!name) {
                throw new Error("I need a name to work with! Please make sure it is path-safe.");
            }
            if (!outDir) {
                throw new Error("No output directory specified! Please specify one in your docusaurus-plugin-gitlab-content config (e.g. to download to the 'docs' folder, set outDir to docs.)");
            }
            if (!locations) {
                throw new Error("The documents field is undefined, so I don't know what to fetch! It should be a string array, function that returns a string array, or promise that resolves with a string array.");
            }
            if (!sourceBaseUrl) {
                throw new Error("The sourceBaseUrl field is undefined, so I don't know where to fetch from!");
            }
            // if (!noRuntimeDownloads) {
            //     await fetchGitLabContent()
            // }
            // noinspection JSUnusedGlobalSymbols
            return [2 /*return*/, {
                    //name: `docusaurus-plugin-gitlab-content-${name}`,
                    name: "docusaurus-plugin-gitlab-content",
                    postBuild: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!performCleanup) return [3 /*break*/, 2];
                                        return [4 /*yield*/, cleanContent()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                    case 2: return [2 /*return*/];
                                }
                            });
                        });
                    },
                    extendCli: function (cli) {
                        var _this = this;
                        cli.command("download-remote-".concat(name))
                            .description("Downloads the remote ".concat(name, " data."))
                            .action(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, utils_1.timeIt)("fetch ".concat(name), fetchGitLabContent)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        }); }); });
                        cli.command("clear-remote-".concat(name))
                            .description("Removes the local copy of the remote ".concat(name, " data."))
                            .action(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, utils_1.timeIt)("clear ".concat(name), cleanContent)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        }); }); });
                    },
                }];
        });
    });
}
exports.default = pluginGitLabContent;
__exportStar(require("./types"), exports);
