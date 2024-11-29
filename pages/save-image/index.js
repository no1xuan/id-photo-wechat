Page({
  data: {
    picUrl: '',
    widthMm: '',
    heightMm: '',
    widthPx: '',
    heightPx: ''
  },

  onLoad: function (e) {
    console.log(e);
    this.setData({
      picUrl: e.picUrl,
      widthMm: e.widthMm,
      heightMm: e.heightMm,
      widthPx: e.widthPx,
      heightPx: e.heightPx
    })
  },

  // 页面卸载时清空数据
  onUnload: function () {
    this.setData({
      picUrl: '',
      widthMm: '',
      heightMm: '',
      widthPx: '',
      heightPx: ''
    });
  },

  // 根据图片url下载保存
  savePicUrlAndImg() {
    const that = this;
    wx.downloadFile({
      url: this.data.picUrl,
      success: function (res) {
        wx.hideLoading();
        // 下载成功后将图片保存到本地
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () {
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            });
          },
          fail: function () {
            that.checkq(); // 解决用户拒绝相册
          }
        });
      },
      fail: function (res) {
        wx.showToast({
          title: '下载图片失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 解决用户拒绝相册问题
  checkq() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.showModal({
            title: '提示',
            content: '保存图片需要授权哦',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting({
                  success: (res) => {
                    this.savePicUrlAndImg();
                  },
                  fail: (res) => {
                    console.log(res);
                  }
                });
              }
            }
          });
        }
      }
    });
  }



  
});