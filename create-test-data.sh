#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ino1eHcyY3VreiIsImlhdCI6MTc2OTU3NTIxNSwiZXhwIjoxNzcwMTgwMDE1fQ.2SI8RZqWcTQzsIBRrdFTrPfhZ61Mi5pxdseBXnmf_R4"

# Crear un laboratorio
echo "Creating lab..."
LAB_RESPONSE=$(curl -s -X POST http://localhost:3000/api/labs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Lab A - Vegetativo","area":50,"light":"LED","temperature":24,"humidity":60,"ph":6.0,"ec":1.5}')

LAB_ID=$(echo "$LAB_RESPONSE" | jq -r '.id // .data.id // empty' 2>/dev/null || echo "")
if [ -z "$LAB_ID" ]; then
  LAB_ID=$(echo "$LAB_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

echo "Lab ID: $LAB_ID"
echo "Lab response: $LAB_RESPONSE"

# Crear mediciones de temperatura (28°C - temperatura elevada)
echo ""
echo "Creating temperature measurements..."
curl -s -X POST http://localhost:3000/api/monitoring/measurements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"batchId\":\"$LAB_ID\",\"type\":\"temperature\",\"value\":28.5,\"unit\":\"C\",\"source\":\"iot\"}"
echo ""

# Crear mediciones de humedad
echo "Creating humidity measurements..."
curl -s -X POST http://localhost:3000/api/monitoring/measurements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"batchId\":\"$LAB_ID\",\"type\":\"humidity\",\"value\":72,\"unit\":\"%\",\"source\":\"iot\"}"
echo ""

# Crear mediciones de pH
echo "Creating pH measurements..."
curl -s -X POST http://localhost:3000/api/monitoring/measurements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"batchId\":\"$LAB_ID\",\"type\":\"ph\",\"value\":6.1,\"unit\":\"\",\"source\":\"iot\"}"
echo ""

# Crear mediciones de EC
echo "Creating EC measurements..."
curl -s -X POST http://localhost:3000/api/monitoring/measurements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"batchId\":\"$LAB_ID\",\"type\":\"ec\",\"value\":1.7,\"unit\":\"mS/cm\",\"source\":\"iot\"}"
echo ""

echo "Test data created!"
