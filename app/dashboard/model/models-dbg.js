sap.ui.define(["sap/ui/model/json/JSONModel", "sap/ui/model/BindingMode", "sap/ui/Device"], function (JSONModel, BindingMode, Device) {
  "use strict";

  var __exports = {
    createDeviceModel: () => {
      const model = new JSONModel(Device);
      model.setDefaultBindingMode(BindingMode.OneWay);
      return model;
    }
  };
  return __exports;
});
//# sourceMappingURL=models-dbg.js.map
