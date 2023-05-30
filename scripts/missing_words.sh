#!/usr/bin/env sh

for word in $(grep "    " words.js | cut -d'"' -f2 | sort -u); do
  echo $word | gawk '{ printf("%-20s", $1)}'
  if [[ -e img/$word.svg || -e img/$word.png ]]; then
    echo ✅
  else
    echo ❌
  fi
done
