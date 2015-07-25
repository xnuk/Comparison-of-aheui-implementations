git clone https://github.com/aheui/caheui --depth=1 -b master

cd caheui
make
mv ./aheui ../aheui

cd ../snippets
rm ../caheui -rf
AHEUI=../aheui ./test.sh
