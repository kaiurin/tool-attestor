const core = require('biot-core');
const eventBus = require('ocore/event_bus');
const fs = require('fs');
const moment = require('moment');

let addresses = {};
try {
	fs.accessSync('./attested', fs.constants.R_OK | fs.constants.W_OK);
	addresses = fs.readFileSync('./attested');
	addresses = JSON.parse(addresses);
} catch (e) {
	addresses = {};
}

(async () => {
	await core.init('test');
	
	eventBus.on('paired', (from_address) => {
		core.sendTechMessageToDevice(from_address, {type: 'imapp'});
	});
	
	eventBus.on('object', async (from_address, object) => {
		if (object.app === 'BIoT') {
			if (object.type === 'hello') {
				if (addresses[from_address]) {
					core.sendTechMessageToDevice(from_address, {
						type: 'render', page: 'attested', form: [
							{type: 'h2', title: 'You attested'}
						]
					});
				} else {
					core.sendTechMessageToDevice(from_address, {
						type: 'render', page: 'index', form: [
							{type: 'input', title: 'UUID', id: 'uuid', required: true},
							{type: 'input', title: 'Type', id: 'type', required: true},
							{type: 'input', title: 'Payment Address', id: 'payment_address', required: true},
							{type: 'input', title: 'Pairing Code', id: 'pairing_code', required: true},
							{type: 'input', title: 'Costs', id: 'costs', required: true},
							{type: 'input', title: 'Location', id: 'location', required: true},
							{type: 'input', title: 'Service URL', id: 'service_url', required: true},
							{type: 'address', required: true, title: 'Select wallet for address', id: 'address'},
							{type: 'blank_line'},
							{type: 'qr', title: 'Scan QR'},
							{type: 'blank_line'},
							{type: 'submit', title: 'Send'}
						]
					});
				}
			} else if (object.type === 'response') {
				if (object.page === 'index') {

					
					let res = await core.postPublicProfile(object.response.address, {
						uuid: object.response.uuid,
						type: object.response.type,
						payment_address: object.response.payment_address,
						pairing_code: object.response.pairing_code,
						costs: object.response.costs,
						location: object.response.location,
						service_url: object.response.service_url,
					});
					core.sendTechMessageToDevice(from_address, {
						type: 'addProfile',
						my_address: res.address,
						your_address: object.response.address,
						unit: res.objJoint.unit.unit,
						profile: res.src_profile
					});
					setTimeout(() => {
						core.sendTechMessageToDevice(from_address, {
							type: 'render', page: 'attested', form: [
								{type: 'h2', title: 'You attested'}
							]
						});
					}, 200);
				}
			}
		}
	});
	
})().catch(console.error);
