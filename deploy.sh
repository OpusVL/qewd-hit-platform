#!/usr/bin/env bash
set -e

hostname=$(hostname)

echo "Updating images"
docker-compose pull

wait
echo "Starting Services"
docker-compose up -d

update_config () {
    # $1 is the docker-compose service
    # $2 is the target file
    docker-compose exec "$1" bash -c "sed -i 's,dev-02,"$hostname",' "$2""
}

echo
echo "Updating configuration files"
update_config openehr_service /opt/qewd/mapped/configuration/openehr.json
update_config oidc_provider /opt/qewd/mapped/configuration/oidc.json
update_config oidc_client /opt/qewd/mapped/configuration/oidc.json

echo
echo "Restarting services"
docker-compose restart
