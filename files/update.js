'use strict';


var ReactNative = require('react-native');
var {
    NativeModules,
    Platform,
    AsyncStorage,
} = ReactNative;

//errors
var
ERROR_NULL = 0,
ERROR_DOWNKOAD_APK = 1,
ERROR_DOWNKOAD_JS = 2,
ERROR_GET_VERSION = 3,
ERROR_FAILED_INSTALL = 4,
ERROR_UNZIP_JS = 5;

var JS_VERISON_ITEM_NAME = "rct_update_js_version_code";
var JS_VERISON_CODE = 0;

var fs = require('react-native-fs');
var RCTUpdate= NativeModules.Update;
var FileTransfer = require('@remobile/react-native-file-transfer');
var Zip = require('@remobile/react-native-zip');

RCTUpdate.getLocalValue("JS_VERSION_CLEAR", (val)=>{
    if (val === "yes") {
        JS_VERISON_CODE = 0;
        AsyncStorage.setItem(JS_VERISON_ITEM_NAME, '0');
        app.updateMgr.setNeedShowSplash(true);
        RCTUpdate.setLocalValue("JS_VERSION_CLEAR", "");
    } else {
        AsyncStorage.getItem(JS_VERISON_ITEM_NAME).then((version)=>{
            JS_VERISON_CODE = version||0;
        });
    }
});

class Update {
    constructor(options) {
        var documentFilePath = RCTUpdate.documentFilePath;
        options.documentFilePath = documentFilePath;
        options.wwwPath = documentFilePath+'www',
        options.jsbundleZipPath = documentFilePath+'www.zip',
        options.localVersionPath = documentFilePath+'version.json',
        this.options = options;
    }
    GET(url, success, error) {
        fetch(url)
        .then((response) => response.json())
        .then((json) => {
            console.log(url, json);
            success && success(json);
        })
        .catch((err) => {
            error(err);
        });
    }
    downloadAppFromServer() {
        console.log("downloadAppFromServer");
        this.downloadApkFromServer();
    }
    downloadApkFromServer() {
        console.log("downloadApkFromServer");
        var oldval;
        var fileTransfer = new FileTransfer();
        if (this.options.onDownloadAPKProgress) {
            fileTransfer.onprogress = (progress) => {
                console.log("downloadApkFromServer", progress.loaded, progress.total, progress);
                var val = parseInt(progress.loaded*100/(progress.total||0.1));
                if (oldval !== val) {
                    this.options.onDownloadAPKProgress(val);
                    oldval = val;
                }
            }
        }
        this.options.onDownloadAPKStart&&this.options.onDownloadAPKStart();
        fileTransfer.download(
            this.options.androidApkUrl,
            this.options.androidApkDownloadDestPath,
            (result)=>{
                this.options.onDownloadAPKEnd&&this.options.onDownloadAPKEnd();
                RCTUpdate.installApk(this.options.androidApkDownloadDestPath);
                setTimeout(()=>{
                    this.options.onError(ERROR_FAILED_INSTALL);
                }, 500);
            },
            (error)=>{
                this.options.onError(ERROR_DOWNKOAD_APK);
            },
            true
        );
    }
    downloadJSFromServer() {
        console.log("downloadJSFromServer");
        var oldval;
        var fileTransfer = new FileTransfer();
        if (this.options.onDownloadJSProgress) {
            fileTransfer.onprogress = (progress) => {
                console.log("downloadJSFromServer", progress.loaded, progress.total, progress);
                var val = parseInt(progress.loaded*100/(progress.total||0.1));
                if (oldval !== val) {
                    this.options.onDownloadJSProgress(val);
                    oldval = val;
                }
            };
        }
        this.options.onDownloadJSStart&&this.options.onDownloadJSStart();
        fileTransfer.download(
            this.options.jsbundleUrl,
            this.options.jsbundleZipPath,
            this.unzipJSZipFile.bind(this),
            (error)=>{
                this.options.onError(ERROR_DOWNKOAD_JS);
            },
            true
        );
    }
    deleteWWWDir() {
        return new Promise((resolve, reject) => {
            fs.unlink(this.options.wwwPath).then(()=>{
                resolve();
            }).catch((err)=>{
                resolve();
            });
        });
    }
    saveLocalJsVersion(ver) {
        return new Promise((resolve, reject) => {
            AsyncStorage.setItem(JS_VERISON_ITEM_NAME, ver+'').then(()=>{
                JS_VERISON_CODE = ver;
                resolve();
            }).catch((err)=>{
                resolve();
            });
        });
    }
    async unzipJSZipFile(result) {
        console.log("unzipJSZipFile", result);
        var oldval;
        this.options.onDownloadJSEnd&&this.options.onDownloadJSEnd();
        var onprogress;
        if (this.options.onUnzipJSProgress) {
            onprogress = (progress) => {
                var val = parseInt(progress.loaded*100/progress.total);
                if (oldval !== val) {
                    this.options.onUnzipJSProgress(val);
                    oldval = val;
                }
            };
        }
        this.options.onUnzipJSStart&&this.options.onUnzipJSStart();
        await this.deleteWWWDir();
        Zip.unzip(this.options.jsbundleZipPath, this.options.documentFilePath,async (res)=>{
            await fs.unlink(this.options.jsbundleZipPath);
            if (res) {
                await this.saveLocalJsVersion(0); //if unzip error, refresh origin version
                this.options.onError(ERROR_UNZIP_JS);
            } else {
                await this.saveLocalJsVersion(this.jsVersionCode);
                await app.updateMgr.setNeedShowSplash(true);
                this.options.onUnzipJSEnd&&this.options.onUnzipJSEnd();
                app.hasNewVersion = '';
                RCTUpdate.restartApp();
            }
        }, onprogress);
    }
    getServerVersion(options) {
        const {versionUrl} = options;
        console.log("getServerVersion", versionUrl);
        this.GET(versionUrl, this.getServerVersionSuccess.bind(this, options), this.getServerVersionError.bind(this, options));
    }
    getServerVersionSuccess(options, remote) {
        console.log("getServerVersionSuccess", options, remote);
        const isandroid = Platform.OS === 'android';
        const {iosVersion, resolve} = options;
        const {versionCode, versionName} = options;
        if (!isandroid && RCTUpdate.versionName !== iosVersion) {
            resolve({newVersion: iosVersion+'.0', needUpdate: 1});
        } else if (isandroid && RCTUpdate.versionCode < versionCode) {
            resolve({newVersion: versionName+'.0', needUpdate: 1});
        } else {
            resolve({newVersion: (isandroid?versionName:iosVersion)+'.0', needUpdate: 1});
        }
    }
    getAppStoreVersion(options) {
        const {iosAppId} = options;
        if (!iosAppId) {
            console.log("getAppStoreVersion without appID");
            this.getServerVersion(options);
            return;
        }
        console.log("getAppStoreVersion with appID:", iosAppId);
        this.GET("http://itunes.apple.com/lookup?id="+iosAppId, this.getAppStoreVersionSuccess.bind(this, options), this.getServerVersionError.bind(this, options));
    }
    getAppStoreVersionSuccess(options, data) {
        console.log("getAppStoreVersionSuccess", data);
        if (data.resultCount < 1) {
            this.getServerVersionError(options);
            return;
        }
        var result = data.results[0];
        options.iosVersion = result.version;
        options.trackViewUrl = result.trackViewUrl;
        this.getServerVersion(options);
    }
    getServerVersionError(options, error) {
        console.log("getServerVersionError", error);
        options.resolve();
    }
    checkVersion(options) {
        return new Promise((resolve)=>{
            let options = {resolve};
            if (Platform.OS === 'android') {
                this.getServerVersion(options);
            } else {
                this.getAppStoreVersion(options);
            }
        });
    }
}

function getVersion() {
    return {
        versionName: RCTUpdate.versionName,
        versionCode: RCTUpdate.versionCode,
        jsVersionCode: JS_VERISON_CODE,
    }
}

Update.getVersion = getVersion;
Update.checkVersion = checkVersion;

module.exports = Update;
