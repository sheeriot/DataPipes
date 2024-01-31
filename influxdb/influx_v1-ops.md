# InfluxDB v1 Help Page

Influx V1 commands for InfluxDB management.

Note that Influx V3 has dropped Flux (Influx v2 preference).

So back to InfluxQL and pure SQL if preferred.

## Install the InfluxDB CLI

### Login to InfluxDB CLI



## Create an InfluxDB v1-style DB and RP for an existing Bucket ID

```bash
% influx v1 dbrp create \
  --bucket-id 70f7009988770 \
  --db name-bucket \
  --rp name-bucket \
  --default
```

## Delete a time range from a bucket

In this example, delete all from before this year.

```bash
influx delete --bucket usfieldtest-ftd \
  --start 2023-01-01T00:00:00Z \
  --stop 2024-01-01T00:00:00Z
  ```

### Connect to Shell

Do stuff from the InfluxQL shell

```bash
% influx v1 shell
InfluxQL Shell 2.6.1
Connected to InfluxDB cloud2 2.0
> use "groupX-siteY"
> drop MEASUREMENT sample1

remove some data by db/table/device..

```bash
> use usfieldtest-konahome
> delete from "kona1" where "dev_eui" = '647fda00000089ba'
# confirm
> select * from "kona1" where "dev_eui" = '647fda00000089ba'
```

