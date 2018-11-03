/**
 * Created by zc1415926 on 2017/5/15.
 */
import React from 'react';
import {render} from 'react-dom';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import Divider from 'material-ui/Divider';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import IconAdd from 'material-ui/svg-icons/content/add';
import IconRemove from 'material-ui/svg-icons/content/remove';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import {cyan500} from 'material-ui/styles/colors';
import Dialog from 'material-ui/Dialog';
import IconButton from 'material-ui/IconButton';
import NavigationClose from 'material-ui/svg-icons/navigation/close';
import injectTapEventPlugin from 'react-tap-event-plugin';
import ReactAudioPlayer from 'react-audio-player';
injectTapEventPlugin();

const electron = window.require('electron');
const {ipcRenderer} = electron;
const muiTheme = getMuiTheme({
    palette: {
        accent1Color: cyan500,
    },

    fontFamily: 'source-Sans-light',
    toolbar: {
        height: 68
    },
});
const styles = {
    container: {
        textAlign: 'center',
        paddingTop: 200,
    },
    appBar:{
        titleStyle:{
            fontFamily: 'source-Serif-bold',
            fontSize: 28,
        }
    },
    btnHeaderRowNum: {
        marginLeft: 20,
        marginRight: 20,
    },
    titleBarDrag: {
        '-webkit-app-region': 'drag',
    },
    noDrag: {
        '-webkit-app-region': 'no-drag',
    },
    btn: {
         width: 220,
         height: 40,
    },
    btnLabel: {
        fontSize: 20,
    },
    txtColHeaderRowNum: {
        width: 120,
        disabled: true,
        floatingLabelStyle: {
            color: '#717171',
            fontSize: 18,
            width: 150,
        },
        inputStyle: {
            fontSize: 20,
            marginTop: 8,
        }
    },
};

import FlatButton from 'material-ui/FlatButton';
class App extends React.Component {

    constructor() {
        super();
        this.state = {
            targetDir: '',
            fileCount: '',
            excelPath: '',
            sourceDataLength: '',
            colHeaderRowNum: 0,
            colHeader: [],
            sourceColNum: -1,
            targetColNum: -1,
            info: '',

            value: 1,

            isSourceHeaderMenuOpen: false,
            isTargetHeaderMenuOpen: false,
            dpValue: 0,

            isRenameErrorDialog: false,
            renameErrorMessage: '',

            musicList: [],
            musicToPlay: '',
        }
    }

    componentDidMount() {
        ipcRenderer.on('open-music-reply', (event, filePath) => {
            let tempArray = this.state.musicList;
            //tempArray = this.state.musicList;
            tempArray.push(filePath);
                this.setState({
                    musicList: tempArray,
                });
            }
        );
    }

    onBtnCloseAppClicked(){
        ipcRenderer.send('close-app');
    }

    onOpenMusicClicked(){
        ipcRenderer.send('open-music');
    }

    showMusicList(item, index){
        return(<tr key={index}>
            <td><button onClick={() => {
                this.onPlayClicked(item)}}>To播放器</button></td>
            <td>{item}</td>
            <td><button onClick={() => {
                this.onRemoveClicked(index)}}>移除</button></td></tr>);
    }

    onPlayClicked(filePath){
        this.setState({
            musicToPlay: filePath,
        });
    }

    onRemoveClicked(index){
        let tempArray = this.state.musicList;
        tempArray.splice(index,1);
        this.setState({
            musicList: tempArray,
        });
    }

    render() {
        return (
            <div className="mainBody">
                <MuiThemeProvider muiTheme={muiTheme}>
                    <AppBar title="人和街小学音乐播放器" titleStyle={styles.appBar.titleStyle} style={styles.titleBarDrag}
                            showMenuIconButton={false}
                            iconElementRight={<IconButton style={styles.noDrag}
                                                          onTouchTap={()=>{this.onBtnCloseAppClicked()}}><NavigationClose /></IconButton>}/>
                </MuiThemeProvider>

                <button onClick={() => {
                    this.onOpenMusicClicked()}}>添加音乐</button>
                <br />
                <p>------------------播放列表------------------</p>
                <table>
                    <tbody>{this.state.musicList.map(this.showMusicList, this)}</tbody>

                </table>

                <p>-------------------播放器--------------------</p>
                <p>当前音乐：{this.state.musicToPlay}</p>
                <ReactAudioPlayer
                    src={this.state.musicToPlay}
                    autoPlay={false}
                    controls
                    volume={0.5}
                />

            </div>
        );
    }
}

render(<App/>, document.getElementById('content'));
