#!/bin/bash

echo "Pulling"
git pull

echo "Change Directory"
cd backendga/

echo "Building Container"
docker-compose up -d --build