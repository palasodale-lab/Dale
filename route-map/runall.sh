#!/bin/bash
cd "$(dirname "$0")"
for i in 0 1 2 3; do s=$((i*720)); e=$((s+720)); node cap.js $s $e seg/part$i.mp4 2 > seg/log$i.txt 2>&1 & done
wait; echo ALLDONE
