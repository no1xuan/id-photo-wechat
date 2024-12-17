const app = getApp()
Page({
    data: {
        detail: {},
        title: '',
        isBeautyOn: 0,
        openIsBeautyOn: 0
    },

    onLoad: function (options) {
        const sizeDetail = JSON.parse(decodeURIComponent(options.data))
        this.setData({
          detail: sizeDetail,
          title: sizeDetail.name
        })
      },

    onShow: function () {
      this.getWebGlow();
    },

  // 美颜开关切换
  onBeautySwitch(e) {
    this.setData({
      isBeautyOn: e.detail.value ? 1 : 0
    })
  },

  //获取管理员是否开启美颜
  getWebGlow() {
    wx.request({
      url: app.url + 'api/getWebGlow',
      method: "POST",
      success: (res) => {
        this.setData({
          openIsBeautyOn: res.data.data
        });
      }
    });
  },

  // 相册选择
  chooseImage() {
    if (wx.getStorageSync("token") == "") {
      wx.navigateTo({
        url: '/pages/login/index',
      });
      return;
    }
    wx.chooseMedia({
      count: 1,
      mediaType: 'image',
      sourceType: ['album'],
      sizeType: 'original',
      camera: 'back',
      success: (res) => {
        const file = res.tempFiles[0];
        const fileType = file.tempFilePath.split('.').pop().toLowerCase();
        const fileSizeMB = file.size / (1024 * 1024);

        // 检查文件格式
        if (fileType !== 'png' && fileType !== 'jpg' && fileType !== 'jpeg') {
          wx.showToast({
            title: '不支持该图片格式',
            icon: 'none',
            duration: 2000
          });
          return;
        }

        // 检查文件大小
        if (fileSizeMB > 15) {
          wx.showToast({
            title: '图片太大啦，不能超15M哦',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        this.imgUpload(res.tempFiles[0].tempFilePath)
      }
    })
  },

  // 相机拍照
  chooseCamera() {
    if (wx.getStorageSync("token") == "") {
      wx.navigateTo({
        url: '/pages/login/index',
      });
      return;
    }
    const {
      category,
      heightMm,
      heightPx,
      id,
      name,
      widthMm,
      widthPx
    } = this.data.detail
    const isBeautyOn = this.data.isBeautyOn
    //选择相机拍照
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.camera']) {
          wx.navigateTo({
            url: "../camera/index",
            success: function (res) {
              res.eventChannel.emit('chooseCamera', {
                category,
                heightMm,
                heightPx,
                id,
                name,
                widthMm,
                widthPx,
                isBeautyOn: isBeautyOn
              })
            }
          })
        } else {
          wx.authorize({
            scope: 'scope.camera',
            success() {},
            fail() {
              that.openConfirm()
            }
          })
        }
      },
      fail() {}
    })
  },

  // 开启摄像头
  openConfirm() {
    wx.showModal({
      content: '检测到您没打开访问摄像头权限，是否打开？',
      confirmText: "确认",
      cancelText: "取消",
      success: function (res) {
        console.log(res);
        if (res.confirm) {
          wx.openSetting({
            success: (res) => {}
          })
        }
      }
    });
  },

  // 上传原图
  imgUpload(filePath) {
    wx.showLoading({
      title: '图片检测中',
    })
    wx.uploadFile({
      url: app.url + 'upload',
      filePath: filePath,
      name: 'file',
      header: {
        'content-type': 'multipart/form-data',
        "token": wx.getStorageSync("token")
      },
      useHighPerformanceMode: true,
      success: (res) => {
        wx.hideLoading();
        let data = JSON.parse(res.data);
        if (data.code == 200) {
          this.imageDivision(data.data);
        } else if (data.code == 404) {
          wx.showToast({
            title: data.data,
            icon: "none",
          });
        } else {
          wx.navigateTo({
            url: '/pages/login/index',
          });
        }
      }
    })


  },

  imageDivision(tu) {
    wx.showLoading({
      title: '制作中...',
    });
    wx.request({
      url: app.url + 'api/createIdPhoto',
      data: {
        "image": tu,
        "type": this.data.detail.category == 4 ? 0 : 1,
        "itemId": this.data.detail.id,
        "isBeautyOn": this.data.isBeautyOn
      },
      header: {
        "token": wx.getStorageSync("token")
      },
      method: "POST",
      success: (res) => {
        wx.hideLoading();
        if (res.data.code == 200) {
          this.goEditPage(res.data.data);
        } else if (res.data.code == 404) {
          wx.showToast({
            title: res.data.data,
            icon: 'none'
          });
        } else {
          wx.navigateTo({
            url: '/pages/login/index',
          });
        }
      }
    });
  },

  // 制作页面
  goEditPage(data) {
    const {
      category,
      heightMm,
      heightPx,
      id,
      name,
      widthMm,
      widthPx
    } = this.data.detail
    const isBeautyOn = this.data.isBeautyOn
    wx.navigateTo({
      url: '/pages/preview/index',
      success: function (res) {
        res.eventChannel.emit('sendImageData', {
          ...data,
          category,
          heightMm,
          heightPx,
          id,
          name,
          widthMm,
          widthPx,
          isBeautyOn: isBeautyOn
        })
      }
    })
  }    


});