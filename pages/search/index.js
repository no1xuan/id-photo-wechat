const app = getApp();
Page({
  data: {
    searchValue: '', // 搜索关键词
    photoSizeList: [], // 搜索结果
    pageNum: 1,
    pageSize: 10,
    total: 0,
    pages: 0,
  },

  onLoad: function () {},


  onSearchChange: function (e) {
    const value = e.detail;
    this.setData({
      searchValue: value,
      pageNum: 1, // 每次输入时从第一页开始加载
      photoSizeList: [] // 清空现有结果
    });
    if (value) {
      this.searchData(value);
    }
  },


  
  onHotSearch: function (e) {
    const value = e.currentTarget.dataset.keyword;
    this.setData({
      searchValue: value,
      pageNum: 1, // 每次输入时从第一页开始加载
      photoSizeList: [], // 清空现有结果
    });
    if (value) {
      this.searchData(value);
    }
  },

  searchData: function (searchValue) {
    wx.showLoading({ title: '搜索中...' });
    wx.request({
      url: app.url + 'item/itemList',
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
        type: 0,
        name: searchValue,
      },
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        if (res.data.code == 200) {
          const records = res.data.data.records || [];
          this.setData({
            photoSizeList: this.data.pageNum == 1 ? records : this.data.photoSizeList.concat(records),
            pageNum: this.data.pageNum + 1,
            total: res.data.data.total,
            pages: res.data.data.pages,
          });
        } else {
          wx.showToast({
            title: '没有找到相关尺寸',
            icon: 'none',
          });
        }
      },
    });
  },

  // 页面下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      photoSizeList: [],
      pageNum: 1,
    });
    this.searchData(this.data.searchValue);
    wx.stopPullDownRefresh();
  },

  // 页面触底时
  onReachBottom: function () {
    if (this.data.pageNum <= this.data.pages) {
      this.loadMoreData();
    } else {
      wx.showToast({
        title: '没有更多尺寸啦~',
        icon: 'none',
      });
    }
  },

  loadMoreData: function () {
    this.searchData(this.data.searchValue);
  },

  onHotSearch: function (e) {
    const hotSearchValue = e.currentTarget.dataset.value;
    this.setData({
      searchValue: hotSearchValue,
      pageNum: 1,
      photoSizeList: [],
    });
    this.searchData(hotSearchValue);
  },

  goNextPage: function (e) {
    const index = e.currentTarget.dataset.index;
    const selectedItem = this.data.photoSizeList[index];
    console.log(selectedItem)
    wx.navigateTo({
      url: `/pages/spec-detail/index?data=${JSON.stringify(selectedItem)}`,
    });
  }

});
