import {Component,ViewChild} from '@angular/core';
import {Storage} from '@ionic/storage';
import {Tabs} from "ionic-angular";
import {Events} from 'ionic-angular';
import {Platform} from 'ionic-angular';
import {PopSer} from '../../providers/pop-ser';
import {AppConfig} from '../../app/app.config';
import {UpdateAppSer}     from '../../providers/updateApp-ser';
import {InterfaceLists}     from '../../providers/interface_list';
import {TrackingListComponent} from '../TrackingModule/tracking-list/tracking-list';
import {AccountDetailsComponent} from '../LoginModule/account-details/account-details';


@Component({
    templateUrl: 'tabs.html',
})
export class TabsPage {
    @ViewChild('mainTabs') tabs:Tabs;
    tab1Root: any = TrackingListComponent;
    tab2Root: any = AccountDetailsComponent;

    constructor(public platform: Platform, public storage: Storage, public interface_lists: InterfaceLists, public popser: PopSer, public updateApp: UpdateAppSer, public events: Events) {
    }

    ionViewDidLoad() {
        console.log('AppConfig.Appmodel---' + AppConfig.Appmodel);
        // console.log('AppConfig.platform---'+AppConfig.platform);
        // console.log('AppConfig.deviceid---'+AppConfig.deviceid);
        // console.log('AppConfig.appName---'+AppConfig.appName);
        // console.log('AppConfig.appVersion---'+AppConfig.appVersion);
        // console.log('AppConfig.userProtocol---'+AppConfig.userProtocol);
        console.log(AppConfig.userInfo);
        // console.log('AppConfig.callingType---'+AppConfig.callingType);
        console.log('AppConfig.inited---' + AppConfig.inited);
        // console.log('AppConfig.balanceMinute---'+AppConfig.balanceMinute);
        // console.log('AppConfig.showCustomerPhone---'+AppConfig.showCustomerPhone);
        console.log('AppConfig.expireDate---' + AppConfig.expireDate);
        console.log('AppConfig.expireDate---' + AppConfig.getIsExpired());

        this.init();
    }

    init() {
        //日首次 系统是否可用-》超期-》获取公告-》提示公告-》检查更新
        if (!AppConfig.getInited()) {
            this.popser.alert('系统暂不可用', () => {
                // this.platform.exitApp();
            });
        } else {
            if (AppConfig.Appmodel != 3) {
                //首次 系统是否可用-》超期-》获取公告-》提示公告-》检查更新
                if (AppConfig.getIsExpired()) {
                    this.popser.alert('使用已超期，请联系管理员续费', () => {
                        // this.platform.exitApp();
                    });
                } else {
                    this.getNotice();
                }

            }
        }
    }

    //获取系统公告  
    getNotice() {
        let all_first: any[] = [];//首次
        let day_first: any[] = [];//每日首次
        this.interface_lists.notice({orgId: AppConfig.userInfo.orgId}).then(
            (returnData) => {
                if (returnData.isSucceed && returnData.data.length > 0) {
                    for (let x in returnData.data) {
                        if (returnData.data[x].showOccasion == '0') {   //首次
                            all_first.push(returnData.data[x]);
                        } else if (returnData.data[x].showOccasion == '1') { //每日首次
                            day_first.push(returnData.data[x]);
                        }
                    }
                    AppConfig.Appmodel == 1 ? this.doNotice(all_first) : this.doNotice(day_first);
                    AppConfig.Appmodel = 3;
                } else {
                    AppConfig.Appmodel = 3;
                    this.checkUpdate();
                }
            }, () => {
                //获取失败
                AppConfig.Appmodel = 3;
                this.checkUpdate();
            }
        );
/*        let returnData: any = {
            isSucceed: true,
            data: [
                {
                    id: 1,
                    title: '首次公告1',
                    subTitle: '11',
                    contentType: 0,
                    content: 'content',
                    showOccasion: 0,
                    seqIndex: 1
                },
                {
                    id: 1,
                    title: '每日首次公告1',
                    subTitle: '副标题',
                    contentType: 0,
                    content: 'content',
                    showOccasion: 1,
                    seqIndex: 5
                },
                {
                    id: 1,
                    title: '每日首次公告4',
                    subTitle: '副标题',
                    contentType: 0,
                    content: 'content',
                    showOccasion: 1,
                    seqIndex: 2
                },
                {
                    id: 1,
                    title: '每日首次公告3',
                    subTitle: '副标题',
                    contentType: 0,
                    content: 'content',
                    showOccasion: 1,
                    seqIndex: 3
                },
                {
                    id: 1,
                    title: '每日首次公告2',
                    subTitle: '',
                    contentType: 1,
                    content: 'img/use_over.png',
                    showOccasion: 1,
                    seqIndex: 4
                },
            ]
        }*/

    }

    //提示公告
    doNotice(arr: any[] = []) {
        let len: number = arr.length;
        let show_index = 0;
        if (len && len > 0) {
            //按索引从大到小排序
            arr.sort(function (a, b) {
                return b.seqIndex - a.seqIndex;
            });
            this.popser.alertDIY({
                title: arr[show_index].title,
                subTitle: arr[show_index].subTitle,
                content: (arr[show_index].contentType == 0 ? arr[show_index].content : '<img  src="' + arr[show_index].content + '" class="img"/>'),
            }, () => {
                this.events.publish('alerted');
            });
            this.events.subscribe('alerted', () => {
                show_index += 1;
                if (show_index < len) {
                    this.popser.alertDIY({
                        title: arr[show_index].title,
                        subTitle: arr[show_index].subTitle,
                        content: (arr[show_index].contentType == 0 ? arr[show_index].content : '<img  src="' + arr[show_index].content + '" class="img"/>'),
                    }, () => {
                        this.events.publish('alerted', show_index);
                    });
                } else {
                    this.events.unsubscribe('alerted');       //注销Events事件
                    this.checkUpdate();
                }
                console.log(show_index);
            });
        } else {
            this.checkUpdate();
        }
    }

    //检查更新
    checkUpdate() {
        this.interface_lists.AppVersionCheck({version:AppConfig.getAppVersion()}).then(
            (returnData)=> {
                if (returnData.isSucceed) {
                    if (returnData.data.hasNewVersion) {  //有新版本
                        this.updateApp.update_notice(returnData);
                    }
                }
            });
    }


}
