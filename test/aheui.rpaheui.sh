hg clone https://bitbucket.org/pypy/pypy

# Hardcoding, Ho!
grep -v 'RPYTHON=../pypy/' Makefile > m
rm Makefile
mv m Makefile

RPYTHON=pypy/rpython/bin/rpython make
mv ./aheui-c ../aheui
