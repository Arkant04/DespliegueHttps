URL=$1
curl -X POST $1/messages?message="testeando"
echo ""
curl $1/messages
echo ""