git clone https://github.com/xnuk/haskell-aheui --depth=1 -b master

cd haskell-aheui
ghc -O2 main.hs -o ../aheui

cd ../snippets
rm ../haskell-aheui -rf
AHEUI=../aheui ./test.sh
