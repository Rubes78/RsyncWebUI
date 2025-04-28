#!/bin/bash

# This script sets up root SSH key and Git user config

# Exit if not root
if [[ $EUID -ne 0 ]]; then
    echo "Please run as root."
    exit 1
fi

# Create SSH directory if needed
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Generate SSH key if none exists
if [ ! -f /root/.ssh/id_ed25519 ]; then
    echo "Generating SSH key..."
    ssh-keygen -t ed25519 -f /root/.ssh/id_ed25519 -q -N ""
else
    echo "SSH key already exists. Skipping key generation."
fi

# Start ssh-agent and add key
eval "$(ssh-agent -s)"
ssh-add /root/.ssh/id_ed25519

# Set global Git config
git config --global user.name "rubes78"
git config --global user.email "rubes78@example.com"

# Set Git to trust all directories under /Volumes and /Quarks if you want
git config --global --add safe.directory '*'

# Output public key
echo ""
echo "=== SSH PUBLIC KEY ==="
cat /root/.ssh/id_ed25519.pub
ec
