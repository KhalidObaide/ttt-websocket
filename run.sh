#!/bin/sh
if [ "$1" = "--client" ]; then
  npm run start:client
elif [ "$1" = "--server" ]; then
  npm run start:server
else
  echo "Please specify --client or --server"
fi

