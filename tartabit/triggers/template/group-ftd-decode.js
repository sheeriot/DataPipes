/* Tartabit Trigger - Decode Payload
Details

Trigger name:
  <group>-<device>-decode

Description:
  <group long name> - <Name of Device> Decode Payload
  
Event type:
  Generic Event

Custom filters:
  key===<group>-<device>-decode

*/
// Decode the Payload from Base64 using Byte Buffer

var tag_set = event.data.data.tag_set
var field_set = event.data.data.field_set
var decode_set = event.data.data.decode_set
var port = decode_set.port
var payload = decode_set.payload

if (payload !== null) {
    // Setup Payload Buffer and log contents
    var buffer = convert.b64ToBin(payload)

    var decoded_payload = Decoder(buffer,port)

    // Adeunis FTD - derived values for this sensor
    field_set.message_type      = ""
    field_set.temperature       = decoded_payload.temperature
    field_set.ul_counter        = decoded_payload.ul_counter
    field_set.battery_voltage   = decoded_payload.battery_voltage
    // Device GPS readings
    field_set.gps_quality       = decoded_payload.gps_quality
    field_set.gps_hdop          = decoded_payload.hdop
    field_set.gps_sats          = decoded_payload.sats
    if (decoded_payload.gps_valid == 1) {
        // log.trace('SAVE DEVICE LOCATION');
        field_set.latitude   = Number(decoded_payload.latitude.toFixed(6))
        field_set.longitude  = Number(decoded_payload.longitude.toFixed(6))
        field_set.message_type = "GPS-Report"
        field_set.gps_valid = true
    } else {
        field_set.gps_valid = false
    }
    
    // Downlink RF signal performance
    field_set.dl_counter = decoded_payload.dl_counter
    field_set.dl_rssi = decoded_payload.rssi_dl
    field_set.dl_snr = decoded_payload.snr_dl
    // Message Type
    if (decoded_payload.trigger == "accelerometer") {
        field_set.message_type = "accelerometer trigger"
    }
    if (decoded_payload.trigger == "pushbutton") {
        field_set.message_type = "pushbutton trigger"
    }
	// log.trace('field_set_decoded:\n' + JSON.stringify(field_set))
}
// log.trace('Field Set:\n' + JSON.stringify(field_set))

//send to Save the Props and the Telem
exec.now('cellnexit-ftd-save', {
    tag_set: tag_set,
    field_set: field_set
})

// Payload Decoder Function - Adeunis FTD
// source https://www.thethingsnetwork.org/labs/story/payload-decoder-for-adeunis-field-test-device-ttn-mapper-integration
function Decoder(bytes, port) {

    function parseCoordinate(raw_value, coordinate) {
        // This function parses a coordinate payload part into 
        // dmm and ddd 
        var raw_itude = raw_value;
        var temp = "";
        // Degree section
        var itude_string = ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        itude_string += ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        coordinate.degrees += itude_string;
        itude_string += "°";
        // Minute section
        temp = ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        temp += ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        itude_string += temp;
        itude_string += ".";
        coordinate.minutes += temp;
        // Decimal section
        temp = ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        temp += ((raw_itude >> 28) & 0xF).toString();
        raw_itude <<= 4;
        itude_string += temp;
        coordinate.minutes += ".";
        coordinate.minutes += temp;
        return itude_string;
    }

    function parseLatitude(raw_latitude, coordinate) {
        var latitude = parseCoordinate(raw_latitude, coordinate);
        latitude += ((raw_latitude & 0xF0) >> 4).toString();
        coordinate.minutes += ((raw_latitude & 0xF0) >> 4).toString();
        return latitude;
    }

    function parseLongitude(raw_longitude, coordinate) {
        var longitude = (((raw_longitude >> 28) & 0xF)).toString();
        coordinate.degrees = longitude;
        longitude += parseCoordinate(raw_longitude << 4, coordinate);
        return longitude;
    }

    function addField(field_no, payload) {
        switch (field_no) {
            // Presence of temperature information
            case 0:
                payload.temperature = bytes[bytes_pos_] & 0x7F;
                // Temperature is negative
                if ((bytes[bytes_pos_] & 0x80) > 0) {
                    payload.temperature -= 128;
                }
                bytes_pos_++;
                break;
                // Transmission triggered by the accelerometer
            case 1:
                payload.trigger = "accelerometer";
                break;
                // Transmission triggered by pressing pushbutton 1
            case 2:
                payload.trigger = "pushbutton";
                break;
            case 3:
                // Presence of GPS information
                log.trace('Got Device GPS Info');
                // GPS Latitude
                // An object is needed to handle and parse coordinates into ddd notation
                var coordinate = {};
                coordinate.degrees = "";
                coordinate.minutes = "";
                var raw_value = 0;
                raw_value |= bytes[bytes_pos_++] << 24;
                raw_value |= bytes[bytes_pos_++] << 16;
                raw_value |= bytes[bytes_pos_++] << 8;
                raw_value |= bytes[bytes_pos_++];
                payload.lati_hemisphere = (raw_value & 1) == 1 ? "South" : "North";
                payload.latitude_dmm = payload.lati_hemisphere.charAt(0) + " ";
                payload.latitude_dmm += parseLatitude(raw_value, coordinate);
                payload.latitude = (parseFloat(coordinate.degrees) + parseFloat(coordinate.minutes) / 60) * ((raw_value & 1) == 1 ? -1.0 : 1.0);
                // GPS Longitude
                coordinate.degrees = "";
                coordinate.minutes = "";
                raw_value = 0;
                raw_value |= bytes[bytes_pos_++] << 24;
                raw_value |= bytes[bytes_pos_++] << 16;
                raw_value |= bytes[bytes_pos_++] << 8;
                raw_value |= bytes[bytes_pos_++];
                payload.long_hemisphere = (raw_value & 1) == 1 ? "West" : "East";
                payload.longitude_dmm = payload.long_hemisphere.charAt(0) + " ";
                payload.longitude_dmm += parseLongitude(raw_value, coordinate);
                payload.longitude = (parseFloat(coordinate.degrees) + parseFloat(coordinate.minutes) / 60) * ((raw_value & 1) == 1 ? -1.0 : 1.0);
                // GPS Quality
                raw_value = bytes[bytes_pos_++];
                //
                gps_valid = 0;
                switch ((raw_value & 0xF0) >> 4)
                {
                    case 1:
                        payload.gps_quality = "Good";
                        payload.gps_valid   = 1;
                        break;
                    case 2:
                        payload.gps_quality = "Average";
                        payload.gps_valid   = 1;
                        break;
                    case 3:
                        payload.gps_quality = "Poor";
                        payload.gps_valid   = 1;
                        break;
                    default:
                        payload.gps_quality = (raw_value >> 4) & 0xF;
                        break;
                }
                payload.hdop = (raw_value >> 4) & 0xF;
                // Number of satellites
                payload.sats = raw_value & 0xF;
                break;
            // Presence of Uplink frame counter
            case 4:
                payload.ul_counter = bytes[bytes_pos_++];
                break;
            // Presence of Downlink frame counter
            case 5:
                payload.dl_counter = bytes[bytes_pos_++];
                break;
            // Presence of battery level information
            case 6:
                payload.battery_millivolts = bytes[bytes_pos_++] << 8;
                payload.battery_millivolts |= bytes[bytes_pos_++];
                payload.battery_voltage = payload.battery_millivolts / 1000;
                break;
            // Presence of Downlink RSSI and SNR information
            case 7:
                // RSSI
                payload.rssi_dl = bytes[bytes_pos_++];
                payload.rssi_dl *= -1;
                // SNR
                payload.snr_dl = bytes[bytes_pos_] & 0x7F;
                if ((bytes[bytes_pos_] & 0x80) > 0) {
                    payload.snr_dl -= 128;
                }
                bytes_pos_++;
                break;
            default:
                // Do nothing
                break;
        }
    }

    // Declaration & initialization
    var status_ = bytes[0];
    var bytes_len_ = bytes.length;
    var bytes_pos_ = 1;
    var i = 0;
    var payload = {};

    // Get raw payload

    var temp_hex_str = ""
    payload.payload = "";
    for (var j = 0; j < bytes_len_; j++) {
        temp_hex_str = bytes[j].toString(16).toUpperCase();
        if (temp_hex_str.length == 1) {
            temp_hex_str = "0" + temp_hex_str;
        }
        payload.payload += temp_hex_str;
    }

    // Get payload values
    do {
        // Check status, whether a field is set
        if ((status_ & 0x80) > 0) {
            addField(i, payload);
        }
        i++;
    }
    while (((status_ <<= 1) & 0xFF) > 0);
    return payload;
}