var t = getApp();

Component({
    options: {
        styleIsolation: "isolated"
    },
    properties: {
        title: {
            value: "",
            type: String
        },
        background: {
            value: "#fff",
            type: String
        },
        nav: {
            value: true,
            type: Boolean
        },
        fixedTop: {
            value: true,
            type: Boolean
        },
        small: {
            value: false,
            type: Boolean
        },
        showTitle: {
            value: true,
            type: Boolean
        },
        autoGoBack: {
            value: true,
            type: Boolean
        }
    },
    data: {
        statusBarHeight: wx.getWindowInfo().statusBarHeight,
        canGoBack: false
    },
    attached: function() {
        this.setData({
            canGoBack: getCurrentPages().length > 1
        });
    },
    methods: {
        back: function() {
            this.triggerEvent("back");
        }
    }
});