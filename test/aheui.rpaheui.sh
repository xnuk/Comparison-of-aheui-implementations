hg clone https://bitbucket.org/pypy/pypy
RPYTHON=pypy/rpython/bin/rpython make aheui-c
mv ./aheui/aheui-c ../aheui
