'use strict';
var React = require('react');
var ReactNative = require('react-native');
var {
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
    Modal,
} = ReactNative;

var Update = require('@remobile/react-native-update');

var
STATUS_HAS_VEW_VERSION = 0,
STATUS_DOWNLOAD_APK_PROGESS = 1,
STATUS_DOWNLOAD_JS_PROGESS = 2,
STATUS_UNZIP_JS_PROGESS = 3,
STATUS_DOWNKOAD_APK_ERROR = 4,
STATUS_DOWNKOAD_JS_ERROR = 5,
STATUS_UNZIP_JS_ERROR = 6,
STATUS_FAILED_INSTALL_ERROR = 7,
STATUS_UPDATE_END = 8;

var
ERROR_NULL = 0,
ERROR_DOWNKOAD_APK = 1,
ERROR_DOWNKOAD_JS = 2,
ERROR_GET_VERSION = 3,
ERROR_FAILED_INSTALL = 4,
ERROR_UNZIP_JS = 5;

var PROGRESS_WIDTH = sr.tw*0.7;
var {Button, ProgressBar} = COMPONENTS;

var ProgressInfo = React.createClass({
    render() {
        const { progress } = this.props;
        if (progress < 1000) {
            return (
                <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                    <Text>{this.props.title} [{progress}%]</Text>
                    <ProgressBar
                        fillStyle={{}}
                        backgroundStyle={{backgroundColor: '#cccccc', borderRadius: 2}}
                        style={{marginTop: 10, width:PROGRESS_WIDTH}}
                        progress={progress/100.0}
                        />
                    <View style={styles.progressText}>
                        <Text>0</Text>
                        <Text>100</Text>
                    </View>
                </View>
            );
        } else {
            let size = progress/1000/1024/1024;
            return (
                <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                    <Text>{this.props.title} [ {size.toFixed(2)} M ]</Text>
                </View>
            );
        }
    }
});

module.exports = React.createClass({
    componentDidMount() {
        var update = new Update({
            versionUrl: app.route.ROUTE_VERSION_INFO_URL,
            jsbundleUrl:app.isandroid?app.route.ROUTE_JS_ANDROID_URL:app.route.ROUTE_JS_IOS_URL,
            androidApkUrl:app.route.ROUTE_APK_URL,
            androidApkDownloadDestPath:'/sdcard/yxjqd.apk',
            iosAppId: CONSTANTS.IOS_APPID,
            needUpdateApp: this.needUpdateApp,
            needUpdateJS: this.needUpdateJS,
            onDownloadAPKStart:()=>{},
            onDownloadAPKProgress:(progress)=>{this.setState({status: STATUS_DOWNLOAD_APK_PROGESS,progress})},
            onDownloadAPKEnd:()=>{},
            onDownloadJSStart:()=>{},
            onDownloadJSProgress:(progress)=>{this.setState({status: STATUS_DOWNLOAD_JS_PROGESS,progress})},
            onDownloadJSEnd:()=>{},
            onUnzipJSStart:()=>{},
            onUnzipJSProgress:(progress)=>{this.setState({status: STATUS_UNZIP_JS_PROGESS,progress})},
            onUnzipJSEnd:()=>{this.setState({status: STATUS_UPDATE_END})},
            onNewestVerion:()=>{},
            onError:(errCode)=>{this.onError(errCode)},
        })
        update.start();
    },
    onError(errCode) {
        if (errCode == ERROR_DOWNKOAD_APK) {
            this.setState({status: STATUS_DOWNKOAD_APK_ERROR});
        } else if (errCode == ERROR_DOWNKOAD_JS) {
            this.setState({status: STATUS_DOWNKOAD_JS_ERROR});
        } else if (errCode == ERROR_FAILED_INSTALL) {
            this.setState({status: STATUS_FAILED_INSTALL_ERROR});
        } else if (errCode == ERROR_UNZIP_JS) {
            this.setState({status: STATUS_UNZIP_JS_ERROR});
        }
    },
    getShowVerion(version) {
        return version.versionName+'.'+version.jsVersionCode;
    },
    needUpdateApp(oldVersion, newVersion, description, callback) {
        this.updateCallback = callback;
        this.setState({modalVisible: true, status: STATUS_HAS_VEW_VERSION, newVersion:this.getShowVerion(newVersion), description});
    },
    needUpdateJS(oldVersion, newVersion, description, callback) {
        this.updateCallback = callback;
        this.setState({modalVisible: true, status: STATUS_HAS_VEW_VERSION, newVersion:this.getShowVerion(newVersion), description});
    },
    doUpdate() {
        var callback = this.updateCallback;
        this.updateCallback = null;
        callback(0);
    },
    getInitialState() {
        return {
            modalVisible:false,
        };
    },
    render() {
        var components = {};
        components[STATUS_DOWNKOAD_APK_ERROR] = (
            <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                <Text style={styles.textInfo}>下载apk文件失败，请在设置里重新更新</Text>
                <TouchableOpacity
                    onPress={()=>{this.setState({modalVisible: false})}}
                    style={styles.buttonStyleContainCannel}>
                    <Text style={styles.buttonStyleCannel}>我知道了</Text>
                </TouchableOpacity>
            </View>
        );
        components[STATUS_DOWNKOAD_JS_ERROR] = (
            <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                <Text style={styles.textInfo}>下载js bundle失败，请在设置里重新更新</Text>
                <TouchableOpacity
                    onPress={()=>{this.setState({modalVisible: false})}}
                    style={styles.buttonStyleContainCannel}>
                    <Text style={styles.buttonStyleCannel}>我知道了</Text>
                </TouchableOpacity>
            </View>
        );
        components[STATUS_UNZIP_JS_ERROR] = (
            <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                <Text style={styles.textInfo}>解压js bundle失败，请在设置里重新更新</Text>
                <TouchableOpacity
                    onPress={()=>{this.setState({modalVisible: false})}}
                    style={styles.buttonStyleContainCannel}>
                    <Text style={styles.buttonStyleCannel}>我知道了</Text>
                </TouchableOpacity>
            </View>
        );
        components[STATUS_FAILED_INSTALL_ERROR] = (
            <View style={[styles.functionContainer, {alignItems: 'center', paddingVertical: 30}]}>
                <Text style={styles.textInfo}>你放弃了安装</Text>
                <TouchableOpacity
                    onPress={()=>{this.setState({modalVisible: false})}}
                    style={styles.buttonStyleContainCannel}>
                    <Text style={styles.buttonStyleCannel}>我知道了</Text>
                </TouchableOpacity>
            </View>
        );
        components[STATUS_HAS_VEW_VERSION] = (
            <View style={styles.functionContainer}>
                <Text style={styles.title}>{`发现新版本(${this.state.newVersion})`}</Text>
                <Text style={styles.redLine}>
                </Text>
                <Text style={styles.content}>
                    {"更新内容："}
                </Text>
                {
                    this.state.description.map((item, i)=>{
                        return (
                            <Text style={styles.contentItem} key={i}>{'- '+item}</Text>
                        )
                    })
                }
                <View style={styles.buttonViewStyle}>
                    <TouchableOpacity
                        onPress={()=>{this.setState({modalVisible: false})}}
                        style={styles.buttonStyleContainCannel}>
                        <Text style={styles.buttonStyleCannel}>以后再说</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={this.doUpdate}
                        style={styles.buttonStyleContain}>
                        <Text style={styles.buttonStyle} >立即更新</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
        components[STATUS_DOWNLOAD_APK_PROGESS] = (
            <ProgressInfo
                title="正在下载APK"
                progress={this.state.progress} />
        );
        components[STATUS_DOWNLOAD_JS_PROGESS] = (
            <ProgressInfo
                title="正在下载Bundle文件"
                progress={this.state.progress} />
        );
        components[STATUS_UNZIP_JS_PROGESS] = (
            <ProgressInfo
                title="正在解压Bundle文件"
                progress={this.state.progress} />
        );
        components[STATUS_UPDATE_END] = (
            <Text>即将重启...</Text>
        );
        return (
            <View>
                <Modal
                    animationType="fade"
                    visible={this.state.modalVisible}
                    transparent={true}
                    >
                    <View style={styles.container}>
                        {components[this.state.status]}
                    </View>
                </Modal>
            </View>
        );
    },
});


var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    functionContainer: {
        width:sr.w-60,
        backgroundColor:'#FFFFFF',
    },
    progressText: {
        flexDirection:'row',
        justifyContent:'space-between',
        width: sr.w*0.7,
    },
    textInfo: {
        color: '#000000',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    buttonViewStyle: {
        flexDirection: 'row',
        width: sr.w-40,
        height: 60,
        justifyContent: 'center',
    },
    redLine: {
        marginTop: 15,
        width: sr.w-60,
        height: 1,
        backgroundColor: '#F1F1F1'
    },
    buttonStyleContain: {
        width: 120,
        height: 35,
        marginLeft: 30,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor: '#DE3031',
    },
    buttonStyleContainCannel: {
        width: 120,
        height: 35,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#DE3031',
    },
    buttonStyle: {
        fontSize: 16,
        color: 'white',
        fontFamily: 'STHeitiSC-Medium',
    },
    buttonStyleCannel: {
        fontSize: 16,
        color: '#DE3031',
        fontFamily: 'STHeitiSC-Medium',
    },
    title: {
        color: '#151515',
        fontSize: 18,
        textAlign: 'center',
        overflow: 'hidden',
        marginTop: 15,
        fontFamily: 'STHeitiSC-Medium',
    },
    content: {
        color:'#000000',
        marginTop: 10,
        marginBottom: 10,
        marginHorizontal: 20,
        fontSize:16,
        fontFamily: 'STHeitiSC-Medium',
    },
    contentItem: {
        color:'#000000',
        marginBottom: 10,
        marginHorizontal: 20,
        fontSize:12,
    },
});
