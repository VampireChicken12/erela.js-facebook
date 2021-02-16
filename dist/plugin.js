"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Facebook = void 0;
const erela_js_1 = require("erela.js");
const REGEX = /(https?:\/\/)(www\.|m\.)?(facebook|fb).com\/.*\/videos\/.*/;
const fetch = require("node-fetch").default;
const { JSDOM } = require("jsdom");
const check = (options) => {
    if (!options)
        throw new TypeError("Options must not be empty.");
    if (typeof options.convertUnresolved !== "undefined" &&
        typeof options.convertUnresolved !== "boolean")
        throw new TypeError(' option "convertUnresolved" must be a boolean.');
};
const buildSearch = (loadType, tracks, error) => ({
    loadType: loadType,
    tracks: tracks !== null && tracks !== void 0 ? tracks : [],
    playlist: null,
    exception: error
        ? {
            message: error,
            severity: "COMMON",
        }
        : null,
});
class Facebook extends erela_js_1.Plugin {
    constructor(options) {
        super();
        check(options);
        this.options = Object.assign({}, options);
    }
    load(manager) {
        this.manager = manager;
        this._search = manager.search.bind(manager);
        manager.search = this.search.bind(this);
    }
    search(query, requester) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const finalQuery = query.query || query;
            if (finalQuery.match(REGEX)) {
                try {
                    const html = fetch(query.replace("/m.", "/")).then((res) => res.text());
                    const document = new JSDOM(html).window.document;
                    const rawdata = document.querySelector('script[type="application/ld+json"]').innerHTML;
                    const json = JSON.parse(rawdata);
                    const obj = {
                        title: document
                            .querySelector('meta[property="og:title"]')
                            .attributes.item(1).value,
                        thumbnail: json.thumbnailUrl,
                        streamURL: json.url,
                        url: html.split('",page_uri:"')[1].split('",')[0],
                        author: json.author.name,
                    };
                    if (obj.streamURL) {
                        const data = this.manager.search(obj.streamURL, requester);
                        data.tracks[0].title = obj.title;
                        data.tracks[0].thumbnail = obj.thumbnail;
                        data.tracks[0].uri = obj.url;
                        if (this.options.convertUnresolved) {
                            data.resolve();
                        }
                        return buildSearch("TRACK_LOADED", data.tracks, null);
                    }
                    else {
                        const msg = "Incorrect type for Facebook URL.";
                        return buildSearch("LOAD_FAILED", null, msg);
                    }
                }
                catch (e) {
                    return buildSearch((_a = e.loadType) !== null && _a !== void 0 ? _a : "LOAD_FAILED", null, (_b = e.message) !== null && _b !== void 0 ? _b : null);
                }
            }
            return this._search(query, requester);
        });
    }
}
exports.Facebook = Facebook;
