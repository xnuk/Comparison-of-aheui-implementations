pushd .
git clone https://github.com/xnuk/haskell-aheui --depth=1 -b master
cd haskell-aheui
ghc -O2 main.hs -o aheui
cd ../snippets
AHEUI=../haskell-aheui/aheui ./test.sh
popd .
rm haskell-aheui -rf
