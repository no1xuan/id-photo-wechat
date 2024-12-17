const app = getApp();

Page({
  data: {
    tu: '', //上传原图片的base64
    uploadedImageUrl: '', //处理后的图片
    isGenerated: 1, // 1待上传，2已上传，3已生成
    dpi: '',
    mattingCount: 0,
    videoUnitId: 0,
    count: null
  },


  onShow() {
    this.getExploreData();
    this.checkTheFreeQuota(6, 6);
    this.getvideoUnit();
  },

  //获取这个功能用户剩余次数，没token/token过期了就不显示
  checkTheFreeQuota(type, type2) {
    if (wx.getStorageSync('token') == '') {
      return;
    }
    this.setData({
      authorized: true
    });
    wx.request({
      url: app.url + 'otherApi/checkTheFreeQuota',
      method: 'GET',
      header: {
        'token': wx.getStorageSync('token')
      },
      data: {
        type: type,
        type2: type2
      },
      success: (res) => {
        this.setData({
          count: res.data.data
        })
      }
    })
  },

  getvideoUnit() {
    wx.request({
      url: app.url + 'api/getvideoUnit',
      method: "POST",
      success: (res) => {
        this.setData({
          videoUnitId: res.data.data.videoUnitId
        });
        this.initRewardedVideoAd(res.data.data.videoUnitId);
      }
    });
  },

  // 初始化激励视频广告
  initRewardedVideoAd(adUnitId) {
    if (wx.createRewardedVideoAd) {
      const rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: adUnitId
      });

      // 确保广告事件只监听一次
      rewardedVideoAd.offLoad();
      rewardedVideoAd.offError();
      rewardedVideoAd.offClose();

      // 监听广告加载成功
      rewardedVideoAd.onLoad(() => {
        console.log('重新拉取广告成功');
      });

      // 监听广告加载失败
      rewardedVideoAd.onError((err) => {
        console.error('激励视频广告加载失败', err);
        // 用户可能观看广告上限，防止无法下载，仍发放奖励
        this.imageDivision();
      });

      // 监听广告关闭事件
      rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded) {
          // 发放奖励
          this.imageDivision();
        } else {
          console.log('没看完广告，不发奖励');
          wx.showToast({
            title: "需要看完广告才能制作哦~",
            icon: 'none',
            duration: 1500
          });
        }
      });
      this.setData({
        rewardedVideoAd: rewardedVideoAd
      });
    } else {
      console.error('微信版本太低不支持激励视频广告');
      // 防止无法下载，所以仍然发放奖励
      this.imageDivision();
    }
  },


  // 加载激励视频广告
  loadRewardedVideoAd() {
    const rewardedVideoAd = this.data.rewardedVideoAd;
    rewardedVideoAd
      .load()
      .then(() => rewardedVideoAd.show())
      .catch((err) => {
        console.error('广告加载失败', err);
        // 看广告上限/网络失败，为了防止无法制作，仍发放奖励
        this.imageDivision();
      });
  },


  handleBack() {
    this.setData({
      uploadedImageUrl: '',
      dpi: '',
      tu: '',
      isGenerated: 1
    });
  },

  //管理员是否开启功能
  getExploreData() {
    wx.request({
      url: app.url + 'otherApi/exploreCount',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'token': wx.getStorageSync('token')
      },
      success: (res) => {
        this.setData({
          mattingCount: res.data.data.mattingCount
        })
      }
    })
  },



  // DPI输入框
  onDpiInput(e) {
    let value = e.detail || '';
    // 移除非数字字符和移除前导0
    value = value.replace(/\D/g, '');
    value = value.replace(/^0+(\d)/, '$1');
    this.setData({
      dpi: value
    });
  },

  // 选择图片
  chooseImage() {
    if (this.data.mattingCount == -1) {
      wx.showToast({
        title: "功能维护中，暂停使用",
        duration: 3000,
        icon: 'none',
      });
      return;
    }

    if (wx.getStorageSync('token') == '') {
      wx.navigateTo({
        url: '/pages/login/index'
      });
      return;
    }


    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['original'],
      success: (res) => {
        const file = res.tempFiles[0];
        const fileType = file.tempFilePath.split('.').pop().toLowerCase();
        const fileSizeMB = file.size / (1024 * 1024);

        if (!['png', 'jpg', 'jpeg'].includes(fileType)) {
          wx.showToast({
            title: '图片格式仅支持png、jpg、jpeg',
            icon: 'none',
            duration: 2000,
          });
          return;
        }

        if (fileSizeMB > 10) {
          wx.showToast({
            title: '图片大小不能超过10MB',
            icon: 'none',
            duration: 2000,
          });
          return;
        }
        this.imgUpload(file.tempFilePath);
      },
    });
  },


  // 上传图片
  imgUpload(filePath) {
    wx.showLoading({
      title: '图片检测中'
    });

    wx.uploadFile({
      url: app.url + 'upload',
      filePath: filePath,
      name: 'file',
      header: {
        'content-type': 'multipart/form-data',
        token: wx.getStorageSync('token'),
      },
      useHighPerformanceMode: true,
      success: (res) => {
        wx.hideLoading();
        const data = JSON.parse(res.data);
        if (data.code == 200) {
         //检查是否还有次数，有次数继续,没次数看广告
          //为什么在这里检查？是因为只有所有图片判断通过后才能进行检查，不然一个错误看一个广告，用户就要骂人了
          this.checkCotun()
          this.setData({
            tu: data.data,
            isGenerated: 2
          });
          wx.showToast({
            title: "上传成功",
            icon: 'none',
          });
        } else if (data.code == 404) {
          wx.showToast({
            title: data.data,
            icon: 'none',
          });
        } else {
          wx.navigateTo({
            url: '/pages/login/index'
          });
        }
      },
    });
  },

    //检查是可以免费下载还是看广告下载
    checkCotun(){
      if(this.data.count==0){  //能跑到这个方法一定有token，所以不用担心值为空
        wx.showModal({
          title: '提示',
          content: '您今日免费次数已用完，需要看一次广告后才能继续使用或等明天再来',
          success: (res) => {
            if (res.confirm) {
              const rewardedVideoAd = this.data.rewardedVideoAd;
              if (rewardedVideoAd) {
                // 尝试播放广告
                rewardedVideoAd.show().catch(() => {
                  // 如果广告未加载成功，则重新加载并播放广告
                  this.loadRewardedVideoAd();
                });
              } else {
                console.error('广告实例不存在');
                // 防止广告权限被封或无广告权限导致用户无法下载
                this.imageDivision();
              }
            } else if (res.cancel) {
              wx.showToast({
                title: '已取消下载',
                icon: 'none'
              });
            }
          }
        });


        
      }else{
        this.imageDivision();  //可以免费下载
      }
  
   
    },


  // 图片处理
  imageDivision() {
    if (this.data.mattingCount == -1) {
      wx.showToast({
        title: "功能维护中，暂停使用",
        duration: 3000,
        icon: 'none',
      });
      return;
    }
    if (this.data.tu == '') {
      wx.showToast({
        title: "请先上传图片",
        icon: 'none',
      });
      return;
    }

    const dpi = parseInt(this.data.dpi, 10);

    if (!isNaN(dpi) && dpi < 72) {
      wx.showToast({
        title: 'DPI最低75哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      });
      return;
    }

    if (!isNaN(dpi) && dpi > 1000) {
      wx.showToast({
        title: 'DPI最高只能1000哦~',
        icon: 'none',
        duration: 2000,
        mask: true
      });
      return;
    }


    wx.showLoading({
      title: '处理中...',
      mask: true
    });

    setTimeout(() => {
      wx.showLoading({
        title: '正在处理细节...',
        mask: true
      });
    }, 1000);

    wx.request({
      url: app.url + 'otherApi/matting',
      data: {
        processedImage: this.data.tu,
        dpi: this.data.dpi
      },
      header: {
        token: wx.getStorageSync('token'),
      },
      method: 'POST',
      success: (res) => {
        wx.hideLoading();
        if (res.data.code == 200) {
          this.setData({
            uploadedImageUrl: res.data.data,
            isGenerated: 3
          });
        } else if (res.data.code == 404) {
          wx.showToast({
            title: res.data.data,
            icon: 'none',
            duration: 2000,
          });
        } else {
          wx.navigateTo({
            url: '/pages/login/index'
          });
        }
      },
      fail: (err) => {
        //请求失败的
        console.log(err);
      },
    });
  },

  downloadPic() {
    const that = this;
    wx.downloadFile({
      url: this.data.uploadedImageUrl,
      success: function (res) {
        wx.hideLoading();
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
            that.checkq();
          }
        });
      },
      fail: function () {
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
                    this.downloadPic();
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