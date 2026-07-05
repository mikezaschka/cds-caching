import JSONModel from "sap/ui/model/json/JSONModel";
import BindingMode from "sap/ui/model/BindingMode";

import Device from "sap/ui/Device";


export default {
	createDeviceModel: () => {
		const model = new JSONModel(Device);
		model.setDefaultBindingMode(BindingMode.OneWay);
		return model;
	}
};
