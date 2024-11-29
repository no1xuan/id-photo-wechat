const app = getApp();
Page({
  data: {
    photoSizeList: [], // 当前加载的数据列表
    pageNum: 1, // 当前页码
    pageSize: 10, // 每页加载数据数量
    total: 0, // 总数据量
    category: 1, // 当前分类
    activeTab: 0, // 当前选中的 tab 索引
    title: app.appName
  },

  onLoad() {
    this.getSizeList();
  },

  getSizeList() {
    const { pageNum, pageSize, category } = this.data;

    wx.request({
      url: app.url + 'item/itemList',
      method: 'GET',
      data: {
        pageNum,
        pageSize,
        type: category,
      },
      success: (res) => {
        if (res.data.code == 200) {
          const { records, total, pages } = res.data.data;
          this.setData({
            photoSizeList: pageNum === 1 ? records : this.data.photoSizeList.concat(records),
            total,
            pageNum: pageNum + 1,
            hasMoreData: pageNum < pages
          });
        }
      }
    });
  },

  // 滚动到底
  moredata() {
    if (this.data.hasMoreData) {
      this.getSizeList();
    } else {
      wx.showToast({
        title: '没有更多尺寸啦~',
        icon: 'none',
      });
    }
  },

  // 切换分类
  changeTab(event) {
    const newCategory = parseInt(event.detail.name);
    this.setData({
      activeTab: event.detail.index,
      category: newCategory,
      photoSizeList: [], // 切换分类时清空当前列表
      pageNum: 1, // 重置页码
      hasMoreData: true // 重置是否有更多数据
    });
    this.getSizeList(); // 重新加载数据
  },

  // 点击卡片跳转详情页
  goNextPage(e) {
    const { index } = e.currentTarget.dataset;
    const itemData = this.data.photoSizeList[index];
    wx.navigateTo({
      url: `/pages/spec-detail/index?data=${JSON.stringify(itemData)}`,
    });
  },

  //根据url跳转
  navigateTo(e){
    wx.navigateTo({
      url: e.currentTarget.dataset.url,
  })
  },

  indexGoNextPage(e) {
    const { type } = e.currentTarget.dataset;
    const itemData = this.data.photoSizeList[type];
    wx.navigateTo({
      url: `/pages/spec-detail/index?data=${JSON.stringify(itemData)}`,
    });
  }


});
