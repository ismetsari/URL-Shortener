#!/bin/bash

# Get dynamic IP and port
MINIKUBE_IP=$(minikube ip)
NODEPORT=30031  # or dynamically extract if needed

# Create ConfigMap with dynamic BASE_URL
kubectl create configmap app-config \
  --from-literal=BASE_URL="http://${MINIKUBE_IP}:${NODEPORT}" \
  --dry-run=client -o yaml | kubectl apply -f -
