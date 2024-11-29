const app = getApp();

Page({
  data: {
    workList: [],
    pageNum: 1,
    pageSize: 5,
    total: 0,
    pages: 0,
    authorized: false
  },

  onLoad() {},

  goLogin: function () {
    wx.navigateTo({
      url: '/pages/login/index',
    });
  },

  onShow: function () {
    if (wx.getStorageSync("token") != "") {
      this.setData({
        authorized: true,
        pageNum: 1,
        workList: []
      });
      this.getSizeList();
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      pageNum: 1,
      workList: []
    });
    this.getSizeList();
  },

  // 上拉加载更多
  onReachBottom: function () {
    if (this.data.pageNum < this.data.pages) {
      this.setData({
        pageNum: this.data.pageNum + 1
      });
      this.getSizeList();
    }
  },

  getSizeList() {
    const that = this;
    wx.showLoading({
      title: '加载中...',
    });
    wx.request({
      url: app.url + 'item/photoList',
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
      },
      header: {
        "token": wx.getStorageSync("token")
      },
      method: "GET",
      success(res) {
        wx.hideLoading();
        wx.stopPullDownRefresh(); // 停止下拉刷新动画
        if (res.data.code == 200) {
          const newData = res.data.data.records;
          const total = res.data.data.total;
          const pages = res.data.data.pages;
          that.setData({
            workList: that.data.pageNum == 1 ? newData : that.data.workList.concat(newData),
            total: total,
            pages: pages
          });
        }
      }
    });
  },

  gotoDetail: function (e) {
    var index = e.currentTarget.dataset.index;
    const itemData = this.data.workList[index];
    wx.navigateTo({
      url: `/pages/album-detail/index?data=${JSON.stringify(itemData)}`,
    });
  },

  // 删除按钮
  handleDelete(e) {
    let that = this;
    const index = e.currentTarget.dataset.index;
    const itemId = this.data.workList[index].id;
    wx.request({
      url: app.url + 'item/deletePhotoId',
      data: {
        id: itemId,
      },
      header: {
        "token": wx.getStorageSync("token")
      },
      method: "GET",
      success(res) {
        wx.hideLoading();
        if (res.data.code == 200) {
          // 本地移除页面元素
          const updatedList = that.data.workList.filter(item => item.id !== itemId);
          that.setData({
            workList: updatedList
          });
          // 检查是否需要重新填充页面
          if (that.data.workList.length < that.data.pageSize && that.data.pageNum <= that.data.pages) {
            that.getSizeList();
          }
        }
      },
      fail() {
        wx.showToast({
          title: '系统繁忙，请稍后再试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }
  
});