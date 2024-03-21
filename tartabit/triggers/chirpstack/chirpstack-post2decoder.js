// log.trace(event.data.body)

tag_set = {
    dev_eui: event.data.body.deviceInfo.devEui,
    gateway: event.data.body.rxInfo[0].gatewayId,
};
// log.trace('deveui: ' + tag_set.dev_eui)

field_set = {
    counter_up: event.data.body.fCnt,
    device_addr: event.data.body.devAddr,
    frequency: event.data.body.txInfo.frequency / 1000000,
    bandwidth: event.data.body.txInfo.modulation.lora.bandwidth,
    spreading_factor: event.data.body.txInfo.modulation.lora.spreadingFactor,
    datarate: event.data.body.rxInfo[0].datarate,
    rssi: event.data.body.rxInfo[0].rssi,
    snr: event.data.body.rxInfo[0].snr,
};

// save deviceName as tag1 
field_set.tag1 = event.data.body.deviceInfo.deviceName;
device_tags = event.data.body.deviceInfo.tags;

for(var key in device_tags) {
    if (key === 'pluscode') {
        pluscode = device_tags[key];
        field_set['pluscode'] =  pluscode;
    }
}

// RxTime
time = event.data.body.time;
time = time.substring(0, time.length - 5);
time = time.replace('+','Z');
rx_time = date.parse(time, 'RFC3339Nano');
rx_time = rx_time / 1000;
field_set.rx_time = rx_time;

decode_set = {
    decoder: event.data.body.tags.decoder,
    payload: event.data.body.data,
    port: event.data.body.fPort,
};

payload_size = 0;
payload_bin = convert.b64ToBin(decode_set.payload);
for(var key in payload_bin) {
    // log.trace('Key:' + key);
    payload_size++;
    var byte = payload_bin[key];
    // log.trace('Byte:' + byte);
}

field_set.payload_size = payload_size;


// log.trace('tag_set: ' + tag_set);
// log.trace('field_set: ' + field_set);
// log.trace('decode_set: ' + decode_set);

exec.now('usdevtest-decode-konahome', {
    tag_set: tag_set,
    field_set: field_set,
    decode_set: decode_set
});

trigger.reply({status:200});