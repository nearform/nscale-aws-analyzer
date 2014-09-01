ssh -i $1 ubuntu@$2 <<'ENDSSH'
nc -i 1 -n 127.0.0.1 12345 <<EOF
GET /images/json HTTP/1.0

EOF
ENDSSH
