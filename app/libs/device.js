
var NA = window.navigator;
var UA = NA.userAgent;
var IsTouch = "ontouchend" in window;

var IsAndroid      = /Android|HTC/i.test(UA) || /Linux/i.test(NA.platform + '');
var IsIPad         = !IsAndroid && /iPad/i.test(UA);
var IsIPhone       = !IsAndroid && /iPod|iPhone/i.test(UA);
var IsIOS          = IsIPad || IsIPhone;
var IsWinPhone     = /Windows Phone/i.test(UA);
var IsWebapp       = NA["standalone"];
var IsXiaoMi       = IsAndroid && /mi\s+/i.test(UA);
var IsUC           = /UCBrowser/i.test(UA);
var IsWeixin       = /MicroMessenger/i.test(UA) || location["search"].match(/wechat/);
var IsBaiduBrowser = /baidubrowser/i.test(UA);
var IsChrome       = window["chrome"];
var IsBaiduBox     = /baiduboxapp/i.test(UA);
var IsPC           = !IsAndroid && !IsIOS && !IsWinPhone;
var IsHTC          = IsAndroid && /HTC\s+/i.test(UA);
var IsBaiduMap     = /baidumap/i.test(UA);
var IsBaiduMapSDK  = /bdmap/i.test(UA);
var IsTieba        = /tieba/i.test(UA);
var IsNuomi        = /nuomi/i.test(UA);

var wallet_index = UA.indexOf('BaiduWallet');
var IsWallet = wallet_index != -1;

var WalletInfo = {};
if( IsWallet ){
  var _ua = UA.slice(wallet_index);
  _ua = _ua.split('-');

  WalletInfo = {
    version : _ua[1],
    OS      : _ua[2],
    ext     : _ua.slice(3).join('-')
  }
}
var ua_detect = {
  IsTouch: IsTouch,
  IsAndroid: IsAndroid,
  IsIPad: IsIPad,
  IsIPhone: IsIPhone,
  IsIOS: IsIOS,
  IsWinPhone: IsWinPhone,
  IsWebapp: IsWebapp,
  IsXiaoMi: IsXiaoMi,
  IsUC: IsUC,
  IsWeixin: IsWeixin,
  IsWechat: IsWeixin,
  IsBaiduBox: IsBaiduBox,
  IsBaiduBrowser: IsBaiduBrowser,
  IsWallet : IsWallet,
  WalletInfo : WalletInfo,
  IsChrome: IsChrome,
  IsPC: IsPC,
  IsHTC: IsHTC,
  IsBaiduMap: IsBaiduMap,
  IsBaiduMapSDK: IsBaiduMapSDK,
  IsTieba: IsTieba,
  IsNuomi: IsNuomi
};

module.exports  = ua_detect;