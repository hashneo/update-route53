#!/usr/bin/env bash
cat cronjob.yml | sed -e "s/\${AWS_ACCESS_KEY_ID}/$AWS_ACCESS_KEY_ID_64/" -e "s/\${AWS_SECRET_ACCESS_KEY}/$AWS_SECRET_ACCESS_KEY_64/" | kubectl delete -f -