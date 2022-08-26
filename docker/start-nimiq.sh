#!/bin/bash

if [ ${MODE,,} = "online" ]; then
    cd /data
    /apps/core-js/clients/nodejs/nimiq --network=main --protocol=dumb --rpc
fi
