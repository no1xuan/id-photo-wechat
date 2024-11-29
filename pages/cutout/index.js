const app = getApp();

Page({
  data: {
    tu: '', //上传原图片的base64
    uploadedImageUrl: '', //处理后的图片
    isGenerated: 1, // 1待上传，2已上传，3已生成
    dpi: ''
  },


  handleBack() {
    this.setData({
      uploadedImageUrl: '',
      dpi: '',
      tu: '',
      isGenerated: 1
    });
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


  // 图片处理
  imageDivision() {
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
      timeout: 300000,
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