#!/usr/bin/env sh

for word in $(grep "    " words.js | cut -d'"' -f2); do
  printf "%-20s" $word
  if [[ -e img/$word.svg || -e img/$word.png ]]; then
    echo ✅
  else
    echo ❌
  fi
done
