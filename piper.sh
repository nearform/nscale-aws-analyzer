#! /bin/bash
#
# TO TEST IT -- execute in separate shells
# rm hello ; nc -k -l -U hello 1>&0
# ./piper hello 12345
# nc localhost 12345

if [ $# -le 1 ]
then
  echo Usage: $0 socket port
  exit 1
fi

PIPE_IN="/tmp/piper-pipe-in"
PIPE_OUT="/tmp/piper-pipe-out"

# TODO only one piper script can run at the same time
# make these random
rm $PIPE_IN &> /dev/null
rm $PIPE_OUT &> /dev/null

mkfifo $PIPE_IN
mkfifo $PIPE_OUT

PID1=-1
PID2=-1
RUNNING=true

trap cleanup INT

function cleanup() {
  echo "trapped ctrl-c"
  RUNNING=""

  rm $PIPE_IN
  rm $PIPE_OUT

  kill -15 $PID1
  kill -15 $PID2
}

while [ $RUNNING ]; do
  nc -l 127.0.0.1 $2 > $PIPE_IN < $PIPE_OUT &
  PID1=$!

  nc -U $1 < $PIPE_IN > $PIPE_OUT &
  PID2=$!

  wait $PID1 $PID2 2> /dev/null
done

echo "finished"
